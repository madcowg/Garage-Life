// Headless season simulator — design doc §10 step 10. Runs many full
// 10-month careers under a few play strategies and reports aggregate stats,
// so the race/work economy and dice rework can be sanity-checked before
// anyone trusts the numbers by eyeballing them.
//
// Run: node scripts/simulate-season.mjs

import { generateCourse, computeTarget, resolveDecision } from "../src/game/logic.js";
import { MODS } from "../src/game/data.js";
import {
  createNewCareer, advanceAfterAction, resolveWork, resolveJobHunt,
  computeRaceReward, checkModUnlocks, checkCarUnlocks, computeSeasonGrade,
  MAINTAIN_COST, SELF_MAINTAIN_COST, SEASON_LENGTH_MONTHS,
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
  let unlockedCars = [];
  let timesFired = 0;
  const firedMonths = [];

  while (career.month <= SEASON_LENGTH_MONTHS) {
    const maintainCost = career.employment.status === "unemployed" ? SELF_MAINTAIN_COST : MAINTAIN_COST;
    const wearCritical = Object.values(career.wear).some(v => v < 35);
    let action = wearCritical && career.cash >= maintainCost ? "maintain" : chooseAction(career);
    if (action === "race" && wearCritical && career.cash < maintainCost) action = "work";

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
      career = advanceAfterAction({ ...career, cash: career.cash - maintainCost, wear: { engine: 100, tires: 100, brakes: 100, trans: 100 } }).career;
    } else {
      const modsInstalled = Object.fromEntries(MODS.map(m => [m.id, unlockedMods.includes(m.id)]));
      const result = simulateRace(career.car, modsInstalled);
      const reward = computeRaceReward({ totalTime: result.totalTime, target: result.target, conesHit: result.cones, blindHazardCount: result.blindHazardCount });
      career = advanceAfterAction({
        ...career,
        cash: career.cash + reward.cash,
        reputation: career.reputation + reward.reputation,
        lifetimeCashEarned: career.lifetimeCashEarned + reward.cash,
        racesEntered: career.racesEntered + 1,
        wins: career.wins + (reward.won ? 1 : 0),
        cleanWins: career.cleanWins + (reward.cleanWin ? 1 : 0),
        wear: result.wear,
      }).career;
    }

    checkModUnlocks(career.lifetimeCashEarned, unlockedMods).forEach(id => unlockedMods.push(id));
    checkCarUnlocks({ reputation: career.reputation, wins: career.wins }, unlockedCars).forEach(id => unlockedCars.push(id));
  }

  const grade = computeSeasonGrade({ wins: career.wins, races: career.racesEntered, reputation: career.reputation });
  return { career, grade, unlockedMods, unlockedCars, timesFired, firedMonths };
}

const STRATEGIES = {
  "race-heavy": () => "race",
  "work-heavy": (career) => (career.ap === 1 ? "race" : "work"),
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
  const allFiredMonths = results.flatMap(r => r.firedMonths);
  const firedMonthHistogram = {};
  allFiredMonths.forEach(m => { firedMonthHistogram[m] = (firedMonthHistogram[m] || 0) + 1; });
  const gradeCounts = {};
  results.forEach(r => { gradeCounts[r.grade] = (gradeCounts[r.grade] || 0) + 1; });
  const modUnlockPct = Object.fromEntries(MODS.map(m => [
    m.label, Math.round(100 * results.filter(r => r.unlockedMods.includes(m.id)).length / RUNS_PER_STRATEGY),
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
  console.log(`  grade distribution: ${JSON.stringify(gradeCounts)}`);
  console.log(`  mod unlock %:     ${JSON.stringify(modUnlockPct)}`);
  console.log(`  car unlock %:     ${JSON.stringify(carUnlockPct)}`);
}

console.log(`Simulating ${RUNS_PER_STRATEGY} seasons per strategy (Miata NA, mid-aggression decisions)...`);
for (const [name, fn] of Object.entries(STRATEGIES)) summarize(name, fn);
