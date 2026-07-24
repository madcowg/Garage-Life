import { CARS, SEGMENTS, MISTAKE_CARDS, TIRE_OPTIONS, MOD_RELEVANCE, CORNER_POOL, CORNER_SEGMENTS, CAR_CORNER_MULT } from "./data";

export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// A real d6 roll drives every outcome — the dice widget on screen shows this
// exact value, it isn't decorative. 6 = best case, 1 = worst case.
export function rollD6() { return 1 + Math.floor(Math.random() * 6); }

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

export function computeTarget(course, carId) {
  const mult = CAR_CORNER_MULT[carId];
  const best = course.reduce((sum, key) => {
    const minTime = Math.min(...SEGMENTS[key].decisions.map(d => d.time));
    return sum + minTime * (CORNER_SEGMENTS.includes(key) ? mult : 1.0);
  }, 0);
  return +(best * 1.08).toFixed(1);
}

export function computeModBonus(mods, segKey) {
  return Object.keys(mods).filter(m => mods[m]).reduce((sum, m) => {
    const relevant = (MOD_RELEVANCE[m] || []).includes(segKey);
    return sum + (relevant ? 0.18 : 0.04);
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

  if (loadout.mods.coilovers_tuned) w.mistake -= 7;
  if (loadout.mods.lsd)             w.trans   -= 5;
  if (loadout.mods.sway_bars)       w.mistake -= 4;
  if (loadout.mods.brake_upgrade)   w.brake   -= 7;
  if (loadout.mods.turbo_stock)     w.engine  += 6;

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

// Resolves a category into a concrete outcome. Rolls the die that the
// DiceWidget will render, then derives the time penalty from that roll —
// same number drives both the visual and the math.
export function resolveOutcome(category, segKey, loadout) {
  const seg = SEGMENTS[segKey];
  const roll = rollD6();

  if (category === "clean") {
    return { kind: "clean", name: "Clean Execution", icon: "✅", color: "#00C853", roll, penalty: penaltyFromRoll(roll, -0.4, 0.1), wear: {}, blind: false };
  }
  if (category === "mistake") {
    const m = MISTAKE_CARDS[seg.mistake];
    return {
      kind: "mistake", name: m.name, icon: m.icon, color: m.isCone ? "#FF2D55" : "#FF6B35", roll,
      penalty: m.isCone ? 2.0 : penaltyFromRoll(roll, 0.3, 0.9), wear: { tires: 3 }, blind: false, isCone: !!m.isCone,
    };
  }
  if (category === "tire") {
    const mitigated = TIRE_OPTIONS[loadout.tire].grip >= 2;
    return { kind: "tire", name: "Tire Stress", icon: "🛞", color: "#FF2D55", roll, penalty: penaltyFromRoll(roll, 0.5, 1.4) - (mitigated ? 0.2 : 0), wear: { tires: 14 }, blind: false };
  }
  if (category === "brake") {
    const mitigated = loadout.mods.brake_upgrade;
    return { kind: "brake", name: "Brake Fade", icon: "🛑", color: "#FF2D55", roll, penalty: penaltyFromRoll(roll, 0.5, 1.4) - (mitigated ? 0.3 : 0), wear: { brakes: 14 }, blind: false };
  }
  if (category === "engine") {
    const hasGauge = loadout.gauges.oilGauge || loadout.gauges.coolantGauge || loadout.gauges.boostGauge;
    return { kind: "engine", name: "Engine Stress", icon: "🔧", color: "#FF2D55", roll, penalty: hasGauge ? penaltyFromRoll(roll, 0.4, 1.3) : penaltyFromRoll(roll, 1.6, 4.0), wear: { engine: 14 }, blind: !hasGauge };
  }
  if (category === "trans") {
    const hasGauge = loadout.gauges.transGauge;
    return { kind: "trans", name: "Transmission Slip", icon: "⚙️", color: "#FF2D55", roll, penalty: hasGauge ? penaltyFromRoll(roll, 0.4, 1.2) : penaltyFromRoll(roll, 1.5, 3.8), wear: { trans: 14 }, blind: !hasGauge };
  }
  return { kind: "clean", name: "Clean Execution", icon: "✅", color: "#00C853", roll, penalty: 0, wear: {}, blind: false };
}

export function resolveDecision(segKey, decisionIdx, loadout, wear) {
  const seg = SEGMENTS[segKey];
  const decision = seg.decisions[decisionIdx];
  const weights = outcomeWeights(segKey, decisionIdx, loadout, wear);
  const category = pick(weights);
  const outcome = resolveOutcome(category, segKey, loadout);

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
    logEntry: { seg: seg.label, decision: decision.label, card: outcome.name, icon: outcome.icon, color: outcome.color, time: segTime, blind: outcome.blind, roll: outcome.roll, isCone: !!outcome.isCone },
  };
}
