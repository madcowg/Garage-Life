// Headless season simulator — design doc §10 step 10. Runs many full
// 10-month careers under a few play strategies and reports aggregate stats,
// so the race/work economy can be sanity-checked before anyone trusts the
// numbers by eyeballing them.
//
// Updated for the AP-economy rework: entry fee + Shop-gated mod installs +
// once-per-month Race/Maintain caps. Bots always skip optional event prep
// (a cash-conservative baseline) — the actual prep risk/reward (hazard
// cards) is validated by packages/card-core-v2's simulator, which this
// legacy dice-engine stand-in doesn't model.
//
// Run: node scripts/simulate-season.mjs

import { generateCourse, computeTarget, resolveDecision } from "../src/game/logic.js";
import { MODS } from "../src/game/data.js";
import {
  createNewCareer, advanceAfterAction, resolveWork, resolveJobHunt,
  computeRaceReward, checkModUnlocks, checkCarUnlocks, computeSeasonGrade,
  MAINTAIN_COST, SELF_MAINTAIN_COST, SEASON_LENGTH_MONTHS, ENTRY_FEE,
} from "../src/game/career.js";

function simulateRace(carId, mods) {
  const course = generateCourse();
  const target = computeTarget(course, carId);
  const loadout = { car: carId, mods, tire: "street_perf", gauges: {}, maintenance: { fluids: true, tires: true, brakes: true } };
  let wear = { engine: 100, tires: 100, brakes: 100, trans: 100 };
  let totalTime = 0, cones = 0, blindHazardCount = 0;
  for (const segKey of course) {
    const { segTime, newWear, outcome } = resolveDecision(segKey, 1, loadout, wear);
    wear = newWear;
    totalTime += segTime;
    if (outcome.isCone) cones++;
    if (outcome.blind) blindHazardCount++;
  }
  return { totalTime, target, cones, blindHazardCount, wear };
}

function runSeason(chooseAction) {
  let career = createNewCareer("miata", "NA");
  let unlockedMods = [];
  let installedMods = [];
  let unlockedCars = [];
  let timesFired = 0;
  let racesSkippedNoCash = 0;
  let shopVisits = 0;
  const firedMonths = [];

  while (career.month <= SEASON_LENGTH_MONTHS) {
    const maintainCost = career.employment.status === "unemployed" ? SELF_MAINTAIN_COST : MAINTAIN_COST;
    const wearCritical = Object.values(career.wear).some(v => v < 35);
    const hasUninstalledMod = unlockedMods.some(id => !installedMods.includes(id));

    let action = chooseAction(career);
    if (wearCritical && career.cash >= maintainCost && !career.maintainedThisMonth) action = "maintain";
    if (action === "race" && (career.racedThisMonth || career.cash < ENTRY_FEE)) {
      if (action === "race" && career.cash < ENTRY_FEE) racesSkippedNoCash++;
      action = "work";
    }
    if (action === "maintain" && career.maintainedThisMonth) action = "work";
    // A rational player installs a paid-for upgrade before doing much else —
    // Shop is free itself (only cash was the mod's unlock threshold), so
    // this never displaces an urgent maintain, just race/work picks.
    if (hasUninstalledMod && action !== "maintain") action = "shop";

    if (action === "work") {
      if (career.employment.status === "unemployed") {
        const hunt = resolveJobHunt();
        const newEmployment = hunt.success
          ? { ...career.employment, status: hunt.instant ? "employed" : "pending", tenureMonths: 0 }
          : career.employment;
        career = advanceAfterAction({ ...career, employment: newEmployment }).career;
      } else {
        const work = resolveWork(career.employment);
        if (work.event === "fired") { timesFired++; firedMonths.push(career.month); }
        career = advanceAfterAction({
          ...career, cash: career.cash + work.cash, lifetimeCashEarned: career.lifetimeCashEarned + work.cash, employment: work.newEmployment,
        }).career;
      }
    } else if (action === "maintain") {
      career = advanceAfterAction({ ...career, cash: career.cash - maintainCost, wear: { engine: 100, tires: 100, brakes: 100, trans: 100 }, maintainedThisMonth: true }).career;
    } else if (action === "shop") {
      shopVisits++;
      unlockedMods.forEach(id => { if (!installedMods.includes(id)) installedMods.push(id); });
      career = advanceAfterAction(career).career;
    } else {
      const modsInstalled = Object.fromEntries(MODS.map(m => [m.id, installedMods.includes(m.id)]));
      const result = simulateRace(career.car, modsInstalled);
      const reward = computeRaceReward({ totalTime: result.totalTime, target: result.target, conesHit: result.cones, blindHazardCount: result.blindHazardCount });
      career = advanceAfterAction({
        ...career,
        cash: career.cash - ENTRY_FEE + reward.cash,
        reputation: career.reputation + reward.reputation,
        lifetimeCashEarned: career.lifetimeCashEarned + reward.cash,
        racesEntered: career.racesEntered + 1,
        wins: career.wins + (reward.won ? 1 : 0),
        cleanWins: career.cleanWins + (reward.cleanWin ? 1 : 0),
        wear: result.wear,
        racedThisMonth: true,
      }).career;
    }

    checkModUnlocks(career.lifetimeCashEarned, unlockedMods).forEach(id => unlockedMods.push(id));
    checkCarUnlocks({ reputation: career.reputation, wins: career.wins }, unlockedCars).forEach(id => unlockedCars.push(id));
  }

  const grade = computeSeasonGrade({ wins: career.wins, races: career.racesEntered, reputation: career.reputation });
  return { career, grade, unlockedMods, installedMods, unlockedCars, timesFired, firedMonths, racesSkippedNoCash, shopVisits };
}

const STRATEGIES = {
  "race-heavy": (career) => (career.racedThisMonth ? "work" : "race"),
  "work-heavy": (career) => (career.ap === 1 && !career.racedThisMonth ? "race" : "work"),
  "balanced":   (career) => ["race", "work", "maintain"][(3 - career.ap) % 3],
};

const RUNS_PER_STRATEGY = 300;

function summarize(strategyName, fn) {
  const results = Array.from({ length: RUNS_PER_STRATEGY }, () => runSeason(fn));
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const cashes = results.map(r => r.career.cash);
  const lifetimeCash = results.map(r => r.career.lifetimeCashEarned);
  const reps = results.map(r => r.career.reputation);
  const wins = results.map(r => r.career.wins);
  const races = results.map(r => r.career.racesEntered);
  const fired = results.filter(r => r.timesFired > 0).length;
  const skippedNoCash = results.filter(r => r.racesSkippedNoCash > 0).length;
  const allFiredMonths = results.flatMap(r => r.firedMonths);
  const firedMonthHistogram = {};
  allFiredMonths.forEach(m => { firedMonthHistogram[m] = (firedMonthHistogram[m] || 0) + 1; });
  const gradeCounts = {};
  results.forEach(r => { gradeCounts[r.grade] = (gradeCounts[r.grade] || 0) + 1; });
  const modUnlockPct = Object.fromEntries(MODS.map(m => [
    m.label, Math.round(100 * results.filter(r => r.unlockedMods.includes(m.id)).length / RUNS_PER_STRATEGY),
  ]));
  const modInstallPct = Object.fromEntries(MODS.map(m => [
    m.label, Math.round(100 * results.filter(r => r.installedMods.includes(m.id)).length / RUNS_PER_STRATEGY),
  ]));
  const carUnlockPct = {
    hondaCivicSir: Math.round(100 * results.filter(r => r.unlockedCars.includes("hondaCivicSir")).length / RUNS_PER_STRATEGY),
    mazdaRx7Fd: Math.round(100 * results.filter(r => r.unlockedCars.includes("mazdaRx7Fd")).length / RUNS_PER_STRATEGY),
  };

  console.log(`\n=== ${strategyName} (${RUNS_PER_STRATEGY} seasons) ===`);
  console.log(`  final cash:       avg $${Math.round(avg(cashes))}  (min $${Math.min(...cashes)}, max $${Math.max(...cashes)})`);
  console.log(`  lifetime earned:  avg $${Math.round(avg(lifetimeCash))}`);
  console.log(`  reputation:       avg ${avg(reps).toFixed(1)}`);
  console.log(`  races entered:    avg ${avg(races).toFixed(1)}`);
  console.log(`  wins:             avg ${avg(wins).toFixed(1)}  (win rate ${(100 * avg(wins) / Math.max(1, avg(races))).toFixed(0)}%)`);
  console.log(`  fired at least 1x: ${Math.round(100 * fired / RUNS_PER_STRATEGY)}%`);
  console.log(`  fired-by-month histogram: ${JSON.stringify(firedMonthHistogram)}`);
  console.log(`  couldn't afford entry fee at least once: ${Math.round(100 * skippedNoCash / RUNS_PER_STRATEGY)}%`);
  console.log(`  grade distribution: ${JSON.stringify(gradeCounts)}`);
  console.log(`  mod unlocked % (threshold met):  ${JSON.stringify(modUnlockPct)}`);
  console.log(`  mod installed % (Shop visit done): ${JSON.stringify(modInstallPct)}`);
  console.log(`  car unlock %:     ${JSON.stringify(carUnlockPct)}`);
}

console.log(`Simulating ${RUNS_PER_STRATEGY} seasons per strategy (Miata NA, mid-aggression decisions, entry fee $${ENTRY_FEE}, prep skipped)...`);
for (const [name, fn] of Object.entries(STRATEGIES)) summarize(name, fn);
