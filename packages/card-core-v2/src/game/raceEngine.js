import {
  CARD_TYPES, CONE_PENALTY_SECONDS, DEFAULT_HAND_SIZE, DEFAULT_WEAR, FLOW_TIME_BONUS,
  MAX_FLOW, OFF_AFFINITY_EFFECT_MULTIPLIER, OFF_AFFINITY_WEAR_MULTIPLIER,
  SEGMENT_TAGS, SYSTEMS,
} from './constants.js';
import { getCard } from './cards.js';
import { buildCompetitiveDeck, buildHazardDeck } from './deckBuilder.js';
import { getDiscipline } from './disciplines.js';
import { shuffle } from './random.js';

function cloneWear(wear = DEFAULT_WEAR) {
  return { brakes: wear.brakes ?? 100, tires: wear.tires ?? 100, engine: wear.engine ?? 100, transmission: wear.transmission ?? 100 };
}
function instantiateCard(cardId, serial) { return { instanceId: `${cardId}:${serial}`, cardId }; }
function drawOne(state) { if (!state.drawPile.length && state.discardPile.length) { state.drawPile = shuffle(state.discardPile, state.random); state.discardPile = []; } const card = state.drawPile.pop(); if (card) state.hand.push(card); return card; }
function drawToHandSize(state) { while (state.hand.length < state.handSize) { if (!drawOne(state)) break; } }
function discardInstance(state, instanceId) { const index = state.hand.findIndex((item) => item.instanceId === instanceId); if (index < 0) return null; const [removed] = state.hand.splice(index, 1); state.discardPile.push(removed); return removed; }
function isOnAffinity(card, segment) { return card.affinity.includes('any') || card.affinity.some((tag) => segment.tags.includes(tag)); }
function strainPenalty(count) { if (count <= 0) return 0; if (count === 1) return 0.2; if (count === 2) return 0.6; if (count === 3) return 1.2; return 1.2 + (count - 3) * 0.8; }
function vehicleAdjustment(vehicle, segment) { const p = vehicle.handlingProfile ?? {}; let value = 0; if (segment.tags.includes(SEGMENT_TAGS.TRANSITION) || segment.tags.includes(SEGMENT_TAGS.PRECISION)) value -= segment.par * (p.transitionBonus ?? 0); if (segment.tags.includes(SEGMENT_TAGS.POWER)) value -= segment.par * (p.powerBonus ?? 0); return value; }
function applyWear(wear, costs, multiplier = 1, modifiers = {}) { for (const [system, raw] of Object.entries(costs ?? {})) { let cost = raw * multiplier; if (system === SYSTEMS.TIRES) cost = cost * (modifiers.tireWearMultiplier ?? 1) + (modifiers.tireWearFlatAdd ?? 0); wear[system] = Math.max(0, wear[system] - cost); } }
function matchingHazards(state, segment) { return state.hand.map((instance) => ({ instance, card: getCard(instance.cardId) })).filter(({ card }) => card.type === CARD_TYPES.HAZARD && card.firesOn?.some((tag) => segment.tags.includes(tag))); }
function resolveHazard(state, segment) {
  const candidates = matchingHazards(state, segment);
  if (!candidates.length) return { fired: false, timePenalty: 0, controlPenalty: 0, dnf: false, cardId: null };
  candidates.sort((a, b) => Number(Boolean(b.card.effect?.dnfUnlessCourseNote)) - Number(Boolean(a.card.effect?.dnfUnlessCourseNote)) || (b.card.effect?.timePenalty ?? 0) - (a.card.effect?.timePenalty ?? 0));
  const { instance, card } = candidates[0]; discardInstance(state, instance.instanceId); const effect = card.effect ?? {};
  if (effect.dnfUnlessCourseNote) { if (state.courseNoteTokens > 0) { state.courseNoteTokens -= 1; return { fired: true, timePenalty: 0, controlPenalty: 0, dnf: false, cardId: card.id, negated: true }; } return { fired: true, timePenalty: 0, controlPenalty: 0, dnf: true, cardId: card.id }; }
  let timePenalty = effect.timePenalty ?? 0;
  if (card.system === SYSTEMS.BRAKES) timePenalty *= state.passives.brakeHazardTimeMultiplier ?? 1;
  if (card.system === SYSTEMS.ENGINE) timePenalty *= state.discipline.thermalHazardScale ?? 1;
  applyWear(state.wear, effect.wear ?? {});
  return { fired: true, timePenalty, controlPenalty: effect.controlPenalty ?? 0, dnf: false, cardId: card.id };
}
function chooseDiscard(state, bot, context) { const choice = bot.chooseDiscard?.({ ...context, hand: [...state.hand] }); if (choice && state.hand.some((item) => item.instanceId === choice)) return choice; return state.hand.find((item) => item.cardId === 'unsettled')?.instanceId ?? state.hand[0]?.instanceId ?? null; }
function playUtility(state, utilityInstance, bot, context) {
  if (!utilityInstance) return { played: false, nextLineTime: 0, tireWearMultiplier: 1 };
  const card = getCard(utilityInstance.cardId);
  if (card.type === CARD_TYPES.STRAIN) { discardInstance(state, utilityInstance.instanceId); return { played: true, cardId: card.id, removedStrain: true, nextLineTime: 0, tireWearMultiplier: 1 }; }
  if (card.type !== CARD_TYPES.UTILITY) throw new Error(`${card.name} is not a Utility card.`);
  discardInstance(state, utilityInstance.instanceId); const effect = card.effect ?? {};
  for (let i = 0; i < (effect.draw ?? 0); i += 1) drawOne(state);
  for (let i = 0; i < (effect.discard ?? 0); i += 1) { const id = chooseDiscard(state, bot, context); if (id) discardInstance(state, id); }
  return { played: true, cardId: card.id, nextLineTime: effect.nextLineTime ?? 0, tireWearMultiplier: effect.tireWearMultiplier ?? 1 };
}
function addStrain(state, count) { for (let i = 0; i < count; i += 1) state.hand.push(instantiateCard('unsettled', ++state.serial)); }
function controlOutcome({ state, card, segment, onAffinity, hazardControlPenalty }) {
  const p = state.vehicle.handlingProfile ?? {}; const tirePenalty = state.passives.controlPenaltyOnPrecision && segment.tags.includes(SEGMENT_TAGS.PRECISION) ? state.passives.controlPenaltyOnPrecision : 0;
  const margin = (card.control ?? 0) + (p.controlBonus ?? 0) + (state.flow > 0 ? 1 : 0) + (onAffinity ? 1 : 0) - segment.precision - hazardControlPenalty - tirePenalty;
  if (margin <= -6) return { coneCount: 0, offCourse: true, margin };
  if (margin <= -4) return { coneCount: 2, offCourse: false, margin };
  if (margin <= -2) return { coneCount: 1, offCourse: false, margin };
  return { coneCount: 0, offCourse: false, margin };
}
function selectLine(state, bot, context) { const playable = state.hand.filter((item) => [CARD_TYPES.TECHNIQUE, CARD_TYPES.AGGRESSION].includes(getCard(item.cardId).type)); const id = bot.chooseLine?.({ ...context, hand: [...state.hand], playable: [...playable] }); return playable.find((item) => item.instanceId === id) ?? null; }
function hazardPreview(ids, passives) { const counts = ids.reduce((r, id) => ({ ...r, [id]: (r[id] ?? 0) + 1 }), {}); if (passives.revealHazardSystems) return { total: ids.length, exact: counts, unknown: 0 }; const visible = {}; let unknown = 0; for (const [id, count] of Object.entries(counts)) { const system = getCard(id).system; if ([SYSTEMS.BRAKES, SYSTEMS.TIRES, 'course-notes'].includes(system)) visible[id] = count; else unknown += count; } return { total: ids.length, visible, unknown }; }

export function getAutocrossTargetTime(course, vehicle) { const par = course.reduce((sum, segment) => sum + segment.par, 0); if (!Number.isFinite(vehicle.autocrossTargetOffset)) throw new Error(`${vehicle.name} does not have a validated autocross target offset.`); return par - vehicle.autocrossTargetOffset; }
export function createRunState({ competitiveDeck, hazardCardIds = [], course, random = Math.random, wear = DEFAULT_WEAR, courseWalks = 2 }) {
  let serial = 0; const instances = [...competitiveDeck.cardIds, ...hazardCardIds].map((id) => instantiateCard(id, ++serial));
  const state = { random, serial, drawPile: shuffle(instances, random), discardPile: [], hand: [], handSize: DEFAULT_HAND_SIZE + (competitiveDeck.passives.handSizeBonus ?? 0), flow: 0, wear: cloneWear(wear), course, passives: competitiveDeck.passives, vehicle: competitiveDeck.vehicle, discipline: getDiscipline('autocross'), courseNoteTokens: Math.max(0, courseWalks - 1), totalTime: 0, cones: 0, dnf: false, segments: [] };
  drawToHandSize(state); return state;
}
// --- Interactive step API -------------------------------------------------
// The bot loop below is a thin driver over these three functions, so an
// interactive UI (human choices) and headless simulation share one
// implementation and can never drift apart.

// Refills the hand, computes strain, fires any matching hazard. If the
// hazard DNFs the run, state.dnf is set and the segment record is pushed.
export function beginSegment(state, segmentIndex) {
  const segment = state.course[segmentIndex];
  drawToHandSize(state);
  const strainCountAtStart = state.hand.filter((item) => item.cardId === 'unsettled').length;
  const segmentStrainPenalty = strainPenalty(strainCountAtStart);
  const hazard = resolveHazard(state, segment);
  if (hazard.dnf) {
    state.dnf = true;
    state.segments.push({ segmentId: segment.id, segmentName: segment.name, dnf: true, hazardCardId: hazard.cardId });
  }
  return { segment, segmentIndex, strainCountAtStart, segmentStrainPenalty, hazard };
}

// Plays a Utility (or discards a Strain) by instance id; null = skip.
// `bot` is optional — draw-then-discard effects fall back to the built-in
// discard policy (Strain first) when no chooser is provided.
export function playUtilityCard(state, instanceId, bot = {}, context = {}) {
  const instance = instanceId ? state.hand.find((item) => item.instanceId === instanceId) ?? null : null;
  return playUtility(state, instance, bot, context);
}

// Resolves the Line play and finishes the segment. lineInstanceId null =
// fall back to Safe Line (always available, prevents bricked hands).
export function finishSegment(state, begin, { lineInstanceId = null, utility = null, runIndex = 0 }) {
  const { segment, strainCountAtStart, segmentStrainPenalty, hazard } = begin;
  const resolvedUtility = utility ?? { played: false, nextLineTime: 0, tireWearMultiplier: 1 };
  const lineInstance = lineInstanceId ? state.hand.find((item) => item.instanceId === lineInstanceId) ?? null : null;
  const lineCard = lineInstance ? getCard(lineInstance.cardId) : getCard('safe-line');
  if (lineInstance) discardInstance(state, lineInstance.instanceId);

  // Cheat Code (the secret car's one-off "bypass" card): guaranteed clean,
  // guaranteed best-case time — segment.par + the card's own timeDelta,
  // full stop. No affinity check, no cone/hazard-time/control penalty, no
  // strain penalty, no wear, no vehicle adjustment, no cold-tire penalty —
  // "no matter the adverse effects in play" means literally none of the
  // usual modifiers apply. It CANNOT undo a same-segment Course Confusion
  // DNF: that hazard resolves in beginSegment, before any Line card is even
  // chosen, so finishSegment never runs at all in that case.
  if (lineCard.effect?.bypassSegment) {
    const segmentTime = segment.par + lineCard.timeDelta;
    state.flow = MAX_FLOW;
    state.totalTime += segmentTime;
    const record = {
      segmentId: segment.id, segmentName: segment.name, lineCardId: lineCard.id,
      utilityCardId: resolvedUtility.cardId ?? null, onAffinity: true, hazardCardId: hazard.cardId,
      strainCountAtStart, strainPenalty: 0, coneCount: 0, controlMargin: 99, segmentTime, flowAfter: state.flow, bypassed: true,
    };
    state.segments.push(record);
    return record;
  }

  const onAffinity = isOnAffinity(lineCard, segment);
  const affinityMultiplier = onAffinity ? 1 : OFF_AFFINITY_EFFECT_MULTIPLIER;
  const wearMultiplier = onAffinity ? 1 : OFF_AFFINITY_WEAR_MULTIPLIER;
  const outcome = controlOutcome({ state, card: lineCard, segment, onAffinity, hazardControlPenalty: hazard.controlPenalty });
  applyWear(state.wear, lineCard.wear, wearMultiplier, { tireWearMultiplier: resolvedUtility.tireWearMultiplier, tireWearFlatAdd: state.passives.tireWearFlatAdd ?? 0 });
  const effect = lineCard.effect ?? {};
  if (effect.addStrainToHand) addStrain(state, effect.addStrainToHand);
  if (outcome.offCourse) {
    state.dnf = true; state.flow = 0;
    const record = { segmentId: segment.id, lineCardId: lineCard.id, dnf: true, dnfReason: 'off-course' };
    state.segments.push(record);
    return record;
  }
  const cold = runIndex === 0 && state.passives.firstRunColdTireTimePenalty ? state.passives.firstRunColdTireTimePenalty / state.course.length : 0;
  const segmentTime = segment.par + lineCard.timeDelta * affinityMultiplier + (state.flow > 0 ? FLOW_TIME_BONUS : 0) + resolvedUtility.nextLineTime + hazard.timePenalty + segmentStrainPenalty + vehicleAdjustment(state.vehicle, segment) + cold + outcome.coneCount * CONE_PENALTY_SECONDS;
  const cleanTechnique = lineCard.type === CARD_TYPES.TECHNIQUE && onAffinity && outcome.coneCount === 0 && !hazard.fired;
  if (effect.breaksFlow || lineCard.type === CARD_TYPES.AGGRESSION || outcome.coneCount > 0) state.flow = 0;
  else if (cleanTechnique) state.flow = MAX_FLOW;
  else if (hazard.fired && !effect.protectFlowFromHazard) state.flow = 0;
  state.totalTime += segmentTime; state.cones += outcome.coneCount;
  const record = { segmentId: segment.id, segmentName: segment.name, lineCardId: lineCard.id, utilityCardId: resolvedUtility.cardId ?? null, onAffinity, hazardCardId: hazard.cardId, strainCountAtStart, strainPenalty: segmentStrainPenalty, coneCount: outcome.coneCount, controlMargin: outcome.margin, segmentTime, flowAfter: state.flow };
  state.segments.push(record);
  return record;
}

export function finalizeRun(state) {
  return { time: state.dnf ? null : state.totalTime, dnf: state.dnf, cones: state.cones, wearAfter: state.wear, segments: state.segments, cardsRemaining: state.drawPile.length, finalHand: state.hand.map((item) => item.cardId) };
}

export function runAutocrossRun({ course, competitiveDeck, hazardCardIds = [], bot, random = Math.random, wear = DEFAULT_WEAR, courseWalks = 2, runIndex = 0 }) {
  const state = createRunState({ competitiveDeck, hazardCardIds, course, random, wear, courseWalks });
  for (let count = 0; count < (state.passives.startingMulligans ?? 0); count += 1) { const id = bot.chooseMulligan?.({ hand: [...state.hand], course, runIndex }); if (!id || !discardInstance(state, id)) break; drawOne(state); }
  for (let segmentIndex = 0; segmentIndex < course.length; segmentIndex += 1) {
    const begin = beginSegment(state, segmentIndex);
    if (state.dnf) break;
    const context = { state, segment: begin.segment, segmentIndex, course, runIndex, hazard: begin.hazard, strainCountAtStart: begin.strainCountAtStart };
    const utilityId = bot.chooseUtility?.({ ...context, hand: [...state.hand] });
    const utility = playUtilityCard(state, utilityId ?? null, bot, context);
    const lineInstance = selectLine(state, bot, context);
    finishSegment(state, begin, { lineInstanceId: lineInstance?.instanceId ?? null, utility, runIndex });
    if (state.dnf) break;
  }
  return finalizeRun(state);
}

// Interactive helpers for the UI event loop — keep the run-correction and
// post-event tire wear rules in ONE place so the interactive controller
// can't drift from runAutocrossEvent.
export function applyRunCorrection(time, runIndex) { return time == null ? null : Math.max(0, time - runIndex * 0.12); }
export function applyPostEventTireWear(wear, passives) { if (passives.postEventTireWear) wear.tires = Math.max(0, wear.tires - passives.postEventTireWear); return wear; }
export function previewHazards(ids, passives) { return hazardPreview(ids, passives); }
export function performMulligan(state, instanceId) { if (!instanceId || !discardInstance(state, instanceId)) return false; drawOne(state); return true; }
export function runAutocrossEvent({ vehicleId, tireId = 'street_performance', modIds = [], bot, random = Math.random, wear = DEFAULT_WEAR, skippedMaintenance = [], courseWalks = 2, runs, targetTime }) {
  const discipline = getDiscipline('autocross'); const competitiveDeck = buildCompetitiveDeck({ vehicleId, tireId, modIds }); const course = discipline.generateCourse(random); let currentWear = cloneWear(wear); const ids = buildHazardDeck({ skippedMaintenance, wear: currentWear, skippedCourseWalk: courseWalks === 0 }); const results = [];
  for (let runIndex = 0; runIndex < (runs ?? discipline.defaultRuns); runIndex += 1) { const result = runAutocrossRun({ course, competitiveDeck, hazardCardIds: ids, bot, random, wear: currentWear, courseWalks, runIndex }); currentWear = result.wearAfter; if (!result.dnf && result.time != null) result.time = Math.max(0, result.time - runIndex * 0.12); results.push(result); }
  if (competitiveDeck.passives.postEventTireWear) currentWear.tires = Math.max(0, currentWear.tires - competitiveDeck.passives.postEventTireWear);
  const bestRun = results.filter((r) => !r.dnf && r.time != null).sort((a, b) => a.time - b.time)[0] ?? null; const par = course.reduce((sum, segment) => sum + segment.par, 0); const resolvedTarget = targetTime ?? getAutocrossTargetTime(course, competitiveDeck.vehicle);
  return { discipline: 'autocross', course, par, targetTime: resolvedTarget, bestTime: bestRun?.time ?? null, won: Boolean(bestRun && bestRun.time <= resolvedTarget), runs: results, wearAfter: currentWear, hazardCardIds: ids, hazardPreview: hazardPreview(ids, competitiveDeck.passives), competitiveDeck };
}
