import { CARS, SEGMENTS, MISTAKE_CARDS, TIRE_OPTIONS, MOD_RELEVANCE, MOD_ADVANTAGE, SAFETY_MOD_ID, CORNER_POOL, CORNER_SEGMENTS, CAR_CORNER_MULT } from "./data.js";

export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// A real d6 roll drives every outcome — the dice widget on screen shows this
// exact value, it isn't decorative. 6 = best case, 1 = worst case.
export function rollD6() { return 1 + Math.floor(Math.random() * 6); }

// Wear stat that maintenance credit applies to, per hazard category — "clean"
// and "mistake" aren't tied to a single wear stat, so they get no maintenance
// modifier (only the mod-driven effects below apply to them).
const CATEGORY_WEAR_STAT = { tire: "tires", brake: "brakes", engine: "engine", trans: "trans" };

// Design doc §9A — a well-maintained car rolls better, a neglected one rolls
// worse, on the *visible* die itself (not a hidden post-hoc subtraction).
function maintenanceModifier(category, wear) {
  const stat = CATEGORY_WEAR_STAT[category];
  if (!stat) return 0;
  if (wear[stat] >= 70) return 1;
  if (wear[stat] < 30) return -1;
  return 0;
}

function hasAdvantage(category, mods) {
  return Object.entries(MOD_ADVANTAGE).some(([modId, cat]) => cat === category && mods[modId]);
}

// Rolls the die(s) for a category: an advantage mod (§9B) rolls twice and
// keeps the better; the maintenance modifier (§9A) and Stage 1 Safety's flat
// +1 (§9C) are then applied to that kept roll. Everything here is returned
// so the DiceWidget can show the whole chain, not just the final number.
function rollForCategory(category, loadout, wear) {
  const rawRoll = rollD6();
  let secondRoll = null;
  let best = rawRoll;
  if (hasAdvantage(category, loadout.mods)) {
    secondRoll = rollD6();
    best = Math.max(rawRoll, secondRoll);
  }
  const modifier = maintenanceModifier(category, wear) + (loadout.mods[SAFETY_MOD_ID] ? 1 : 0);
  const roll = clamp(best + modifier, 1, 6);
  return { rawRoll, secondRoll, modifier, roll };
}

function penaltyFromRoll(roll, lo, hi) {
  return hi - ((roll - 1) / 5) * (hi - lo);
}

export function pick(weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  if (total <= 0) return "clean";
  let r = Math.random() * total;
  for (const [k, w] of entries) { if (r < w) return k; r -= w; }
  return entries[entries.length - 1][0];
}

export function generateCourse() {
  const shuffled = [...CORNER_POOL].sort(() => Math.random() - 0.5);
  return ["launch", ...shuffled, "finish"];
}

// Buffer tuned via scripts/tune-target-buffer.mjs against the user's
// explicit ~50% average-win-rate target. Re-tuned after segment base times
// were rescaled 3x (real autocross runs ~30-45s, not 10-15s) — at that
// larger time scale, hazard penalties (fixed absolute seconds) are a smaller
// fraction of the run, so the same win rate now needs a tighter buffer:
// 1.24 gives ~50% for a fully Stage 1-modded car at mid-aggression
// decisions. The season's own mod progression is still the difficulty curve
// (struggle stock, approach par once built).
export function computeTarget(course, carId) {
  const mult = CAR_CORNER_MULT[carId];
  const best = course.reduce((sum, key) => {
    const minTime = Math.min(...SEGMENTS[key].decisions.map(d => d.time));
    return sum + minTime * (CORNER_SEGMENTS.includes(key) ? mult : 1.0);
  }, 0);
  return +(best * 1.24).toFixed(1);
}

// Only mods listed in MOD_RELEVANCE contribute a flat time bonus (currently
// just Stage 1 Engine) — Brakes/Suspension/Safety act on the dice roll
// itself (see rollForCategory above), not on segment time directly.
export function computeModBonus(mods, segKey) {
  return Object.keys(MOD_RELEVANCE).filter(m => mods[m]).reduce((sum, m) => {
    return sum + (MOD_RELEVANCE[m].includes(segKey) ? 0.18 : 0.04);
  }, 0);
}

// Weighted outcome category per segment, shaped by decision aggression,
// installed mods, tire compound, skipped maintenance (dread), and current wear.
export function outcomeWeights(segKey, decisionIdx, loadout, wear) {
  let w = { clean: 40, mistake: 16, tire: 8, brake: 0, trans: 0, engine: 0 };
  if (["hairpin", "chicane"].includes(segKey)) w.brake = 10;
  if (["launch", "finish", "sweeper"].includes(segKey)) w.engine = 10;
  if (["launch", "slalom", "finish"].includes(segKey)) w.trans = 9;
  if (["hairpin", "sweeper", "slalom", "chicane"].includes(segKey)) w.tire += 6;

  w.clean   -= decisionIdx * 9;
  w.mistake += decisionIdx * 6;
  w.tire    += decisionIdx * 3;
  w.engine  += decisionIdx * 3;
  w.trans   += decisionIdx * 3;
  w.brake   += decisionIdx * 2;

  if (loadout.mods.stage1_suspension) w.mistake -= 7;
  if (loadout.mods.stage1_brakes)     w.brake   -= 7;
  // Stage 1 Engine deliberately adds no risk here (real filter+exhaust bolt-ons
  // don't meaningfully increase mechanical risk, unlike the old Turbo mod).
  // No mod currently reduces "trans" weight — known gap, design doc §7.

  w.tire += TIRE_OPTIONS[loadout.tire].wearRate * 3;

  if (!loadout.maintenance.fluids) w.engine += 10;
  if (!loadout.maintenance.tires)  w.tire   += 10;
  if (!loadout.maintenance.brakes) w.brake  += 10;

  if (wear.engine < 50) w.engine += 8;
  if (wear.tires  < 50) w.tire   += 8;
  if (wear.brakes < 50) w.brake  += 8;
  if (wear.trans  < 50) w.trans  += 8;

  Object.keys(w).forEach(k => (w[k] = Math.max(0, w[k])));
  return w;
}

// Resolves a category into a concrete outcome. Rolls the die(s) that the
// DiceWidget will render (rollForCategory — see design doc §9 for the
// maintenance-modifier/advantage/Safety chain), then derives the time
// penalty from the final roll — same number drives both the visual and the
// math. No hidden post-roll mitigation happens here anymore; every build
// advantage is folded into the roll itself before this point.
export function resolveOutcome(category, segKey, loadout, wear) {
  const seg = SEGMENTS[segKey];
  const rollInfo = rollForCategory(category, loadout, wear);
  const { roll } = rollInfo;

  if (category === "clean") {
    return { kind: "clean", name: "Clean Execution", icon: "✅", color: "#00C853", ...rollInfo, penalty: penaltyFromRoll(roll, -0.4, 0.1), wear: {}, blind: false };
  }
  if (category === "mistake") {
    const m = MISTAKE_CARDS[seg.mistake];
    return {
      kind: "mistake", name: m.name, icon: m.icon, color: m.isCone ? "#FF2D55" : "#FF6B35", ...rollInfo,
      penalty: m.isCone ? 2.0 : penaltyFromRoll(roll, 0.3, 0.9), wear: { tires: 3 }, blind: false, isCone: !!m.isCone,
    };
  }
  if (category === "tire") {
    return { kind: "tire", name: "Tire Stress", icon: "🛞", color: "#FF2D55", ...rollInfo, penalty: penaltyFromRoll(roll, 0.5, 1.4), wear: { tires: 14 }, blind: false };
  }
  if (category === "brake") {
    return { kind: "brake", name: "Brake Fade", icon: "🛑", color: "#FF2D55", ...rollInfo, penalty: penaltyFromRoll(roll, 0.5, 1.4), wear: { brakes: 14 }, blind: false };
  }
  if (category === "engine") {
    const hasGauge = loadout.gauges.oilGauge || loadout.gauges.coolantGauge || loadout.gauges.boostGauge;
    return { kind: "engine", name: "Engine Stress", icon: "🔧", color: "#FF2D55", ...rollInfo, penalty: hasGauge ? penaltyFromRoll(roll, 0.4, 1.3) : penaltyFromRoll(roll, 1.6, 4.0), wear: { engine: 14 }, blind: !hasGauge };
  }
  if (category === "trans") {
    const hasGauge = loadout.gauges.transGauge;
    return { kind: "trans", name: "Transmission Slip", icon: "⚙️", color: "#FF2D55", ...rollInfo, penalty: hasGauge ? penaltyFromRoll(roll, 0.4, 1.2) : penaltyFromRoll(roll, 1.5, 3.8), wear: { trans: 14 }, blind: !hasGauge };
  }
  return { kind: "clean", name: "Clean Execution", icon: "✅", color: "#00C853", ...rollInfo, penalty: 0, wear: {}, blind: false };
}

export function resolveDecision(segKey, decisionIdx, loadout, wear) {
  const seg = SEGMENTS[segKey];
  const decision = seg.decisions[decisionIdx];
  const weights = outcomeWeights(segKey, decisionIdx, loadout, wear);
  const category = pick(weights);
  const outcome = resolveOutcome(category, segKey, loadout, wear);

  const statVal = CARS[loadout.car][seg.statKey];
  const statBonus = statVal * 0.06;
  const tireBonus = TIRE_OPTIONS[loadout.tire].grip * 0.05;
  const modBonus = computeModBonus(loadout.mods, segKey);
  const cornerMult = CORNER_SEGMENTS.includes(segKey) ? CAR_CORNER_MULT[loadout.car] : 1.0;
  const segTime = Math.max(0.4, (decision.time - statBonus - tireBonus - modBonus + outcome.penalty) * cornerMult);

  const newWear = { ...wear };
  Object.entries(decision.stress).forEach(([k, v]) => { newWear[k] = clamp(newWear[k] - v * 0.6, 0, 100); });
  Object.entries(outcome.wear || {}).forEach(([k, v]) => { newWear[k] = clamp(newWear[k] - v, 0, 100); });

  return {
    segTime, newWear, outcome, decision,
    logEntry: {
      seg: seg.label, decision: decision.label, card: outcome.name, icon: outcome.icon, color: outcome.color, time: segTime,
      blind: outcome.blind, roll: outcome.roll, rawRoll: outcome.rawRoll, secondRoll: outcome.secondRoll, modifier: outcome.modifier,
      isCone: !!outcome.isCone,
    },
  };
}
