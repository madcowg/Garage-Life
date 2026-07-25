// ============================================================================
// CARD-CORE-V2 ADAPTER — bridges the career layer (car ids, Stage 1 mods,
// maintenance checklist) to the packages/card-core-v2 engine, and wraps the
// engine's step API in an interactive event controller for the React UI.
// The engine itself stays pure and headless; everything React touches goes
// through this file.
// ============================================================================

import {
  buildCompetitiveDeck, buildHazardDeck, getDiscipline, getCard,
  createRunState, beginSegment, playUtilityCard, finishSegment, finalizeRun,
  applyRunCorrection, applyPostEventTireWear, previewHazards,
  getAutocrossTargetTime, CARD_TYPES,
} from "../../packages/card-core-v2/src/game/index.js";

export { getCard, CARD_TYPES };

// Career car id (+ Miata variant) -> engine vehicle id. The NA and NB are
// mechanically identical in the career layer, so both map to the one
// validated Miata identity package; the sprite variant stays cosmetic.
const VEHICLE_MAP = { miata: "miata_nb", integra: "integra_gsr", corvette: "corvette_c6" };

// Career Stage 1 mod ids -> engine mod ids. stage1_safety becomes driver_fit
// (mulligan, no speed); gauges collapse into basic_diagnostics (pre-race
// hazard information, no speed) — same philosophy, one toggle.
const MOD_MAP = {
  stage1_engine: "stage1_engine",
  stage1_brakes: "stage1_brakes",
  stage1_suspension: "stage1_suspension",
  stage1_safety: "driver_fit",
};

const TIRE_MAP = { all_season: "all_season", street_perf: "street_performance", racing: "racing_compound" };

// Maintenance checklist -> engine skipped-maintenance systems.
const CHECKLIST_SYSTEM = { fluids: "engine", tires: "tires", brakes: "brakes" };

export function toEngineConfig(loadout, wear) {
  const vehicleId = VEHICLE_MAP[loadout.car];
  if (!vehicleId) throw new Error(`No engine mapping for car ${loadout.car}`);
  const modIds = Object.entries(loadout.mods ?? {}).filter(([, on]) => on).map(([id]) => MOD_MAP[id]).filter(Boolean);
  if (loadout.diagnostics) modIds.push("basic_diagnostics");
  const skippedMaintenance = Object.entries(loadout.maintenance ?? {}).filter(([, checked]) => !checked).map(([item]) => CHECKLIST_SYSTEM[item]).filter(Boolean);
  return {
    vehicleId,
    tireId: TIRE_MAP[loadout.tire] ?? "street_performance",
    modIds,
    skippedMaintenance,
    courseWalks: loadout.courseWalk === false ? 0 : 2,
    wear: { brakes: wear.brakes, tires: wear.tires, engine: wear.engine, transmission: wear.trans },
  };
}

// Builds deck + hazard preview for the pre-race screen without starting a run.
export function buildPreRacePreview(loadout, wear) {
  const config = toEngineConfig(loadout, wear);
  const deck = buildCompetitiveDeck({ vehicleId: config.vehicleId, tireId: config.tireId, modIds: config.modIds });
  const hazardIds = buildHazardDeck({ skippedMaintenance: config.skippedMaintenance, wear: config.wear, skippedCourseWalk: config.courseWalks === 0 });
  return { deck, hazardIds, preview: previewHazards(hazardIds, deck.passives) };
}

// Interactive event controller. One instance per Race action. Mutates its
// internal run state through the engine's step API; the React screen calls
// snapshot() after every action and re-renders from that.
export class AutocrossEvent {
  constructor(loadout, careerWear) {
    const config = toEngineConfig(loadout, careerWear);
    this.config = config;
    this.discipline = getDiscipline("autocross");
    this.deck = buildCompetitiveDeck({ vehicleId: config.vehicleId, tireId: config.tireId, modIds: config.modIds });
    this.course = this.discipline.generateCourse(Math.random);
    this.hazardIds = buildHazardDeck({ skippedMaintenance: config.skippedMaintenance, wear: config.wear, skippedCourseWalk: config.courseWalks === 0 });
    this.targetTime = getAutocrossTargetTime(this.course, this.deck.vehicle);
    this.par = this.course.reduce((sum, s) => sum + s.par, 0);
    this.totalRuns = this.discipline.defaultRuns;
    this.runIndex = -1;
    this.results = [];
    this.wear = { ...config.wear };
    this.state = null;
    this.begin = null;
    this.utilityResult = null;
    this.phase = "betweenRuns"; // betweenRuns | chooseCards | segmentDone | eventDone
    this.lastRecord = null;
  }

  startRun() {
    this.runIndex += 1;
    this.state = createRunState({
      competitiveDeck: this.deck, hazardCardIds: this.hazardIds, course: this.course,
      random: Math.random, wear: this.wear, courseWalks: this.config.courseWalks,
    });
    this.segmentIndex = 0;
    this.utilityResult = null;
    this.lastRecord = null;
    this._beginSegment();
  }

  _beginSegment() {
    this.begin = beginSegment(this.state, this.segmentIndex);
    this.utilityResult = null;
    if (this.state.dnf) this._endRun();
    else this.phase = "chooseCards";
  }

  playUtility(instanceId) {
    if (this.phase !== "chooseCards" || this.utilityResult?.played) return;
    this.utilityResult = playUtilityCard(this.state, instanceId, {}, {});
  }

  playLine(instanceId) {
    if (this.phase !== "chooseCards") return;
    this.lastRecord = finishSegment(this.state, this.begin, {
      lineInstanceId: instanceId, utility: this.utilityResult, runIndex: this.runIndex,
    });
    if (this.state.dnf) { this._endRun(); return; }
    this.phase = "segmentDone";
  }

  nextSegment() {
    if (this.phase !== "segmentDone") return;
    this.segmentIndex += 1;
    if (this.segmentIndex >= this.course.length) this._endRun();
    else this._beginSegment();
  }

  _endRun() {
    const result = finalizeRun(this.state);
    result.time = applyRunCorrection(result.time, this.runIndex);
    this.results.push(result);
    this.wear = { ...result.wearAfter };
    this.phase = this.runIndex + 1 >= this.totalRuns ? "eventDone" : "betweenRuns";
    if (this.phase === "eventDone") applyPostEventTireWear(this.wear, this.deck.passives);
  }

  // Player may bank their best time and skip remaining runs.
  endEventEarly() {
    if (this.phase !== "betweenRuns") return;
    this.phase = "eventDone";
    applyPostEventTireWear(this.wear, this.deck.passives);
  }

  bestRun() {
    const finished = this.results.filter(r => !r.dnf && r.time != null);
    return finished.sort((a, b) => a.time - b.time)[0] ?? null;
  }

  summary() {
    const best = this.bestRun();
    return {
      course: this.course, par: this.par, targetTime: this.targetTime,
      bestTime: best?.time ?? null, won: Boolean(best && best.time <= this.targetTime),
      bestCones: best?.cones ?? 0,
      hazardsFiredInBest: best ? best.segments.filter(s => s.hazardCardId).length : 0,
      runs: this.results, wearAfter: this.wear,
    };
  }

  hand() { return this.state ? this.state.hand.map(i => ({ instanceId: i.instanceId, card: getCard(i.cardId) })) : []; }
  snapshot() {
    return {
      phase: this.phase, runIndex: this.runIndex, totalRuns: this.totalRuns,
      segmentIndex: this.segmentIndex ?? 0, course: this.course,
      segment: this.begin?.segment ?? null, hazard: this.begin?.hazard ?? null,
      strainPenalty: this.begin?.segmentStrainPenalty ?? 0,
      utilityPlayed: Boolean(this.utilityResult?.played), utilityResult: this.utilityResult,
      hand: this.hand(), flow: this.state?.flow ?? 0, wear: this.state?.wear ?? this.wear,
      totalTime: this.state?.totalTime ?? 0, cones: this.state?.cones ?? 0,
      dnf: this.state?.dnf ?? false, lastRecord: this.lastRecord,
      targetTime: this.targetTime, results: this.results,
      hazardPreview: previewHazards(this.hazardIds, this.deck.passives),
    };
  }
}

// Wear conversion back to the career's key names.
export function toCareerWear(engineWear) {
  return { engine: engineWear.engine, tires: engineWear.tires, brakes: engineWear.brakes, trans: engineWear.transmission };
}
