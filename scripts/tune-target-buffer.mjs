// One-off tuning helper — tests several target-time buffer values to find
// one landing near a 50% average win rate (user's explicit target), before
// applying the winning value as a real change to logic.js's computeTarget.
// Not part of the app; throwaway once the buffer is chosen.

import { SEGMENTS, CORNER_SEGMENTS, CAR_CORNER_MULT } from "../src/game/data.js";
import { resolveDecision, generateCourse } from "../src/game/logic.js";

function computeTargetWithBuffer(course, carId, buffer) {
  const mult = CAR_CORNER_MULT[carId];
  const best = course.reduce((sum, key) => {
    const minTime = Math.min(...SEGMENTS[key].decisions.map(d => d.time));
    return sum + minTime * (CORNER_SEGMENTS.includes(key) ? mult : 1.0);
  }, 0);
  return +(best * buffer).toFixed(1);
}

// Fully-modded Miata (steady-state build most of a season is played in),
// mid-aggression decisions throughout — same "average player" proxy as the
// main simulator.
const FULL_MODS = { stage1_engine: true, stage1_brakes: true, stage1_suspension: true, stage1_safety: true };

function simulateOneRace(buffer) {
  const course = generateCourse();
  const target = computeTargetWithBuffer(course, "miata", buffer);
  const loadout = { car: "miata", mods: FULL_MODS, tire: "street_perf", gauges: {}, maintenance: { fluids: true, tires: true, brakes: true } };
  let wear = { engine: 100, tires: 100, brakes: 100, trans: 100 };
  let totalTime = 0;
  for (const segKey of course) {
    const { segTime, newWear } = resolveDecision(segKey, 1, loadout, wear);
    wear = newWear;
    totalTime += segTime;
  }
  return totalTime <= target;
}

const N = 4000;
for (const buffer of [1.08, 1.15, 1.20, 1.25, 1.30, 1.35, 1.40, 1.45]) {
  let wins = 0;
  for (let i = 0; i < N; i++) if (simulateOneRace(buffer)) wins++;
  console.log(`buffer ${buffer.toFixed(2)}: win rate ${(100 * wins / N).toFixed(1)}%`);
}

console.log("\n--- stock car (no mods) at buffer 1.30, for comparison ---");
function simulateStockRace(buffer) {
  const course = generateCourse();
  const target = computeTargetWithBuffer(course, "miata", buffer);
  const loadout = { car: "miata", mods: {}, tire: "street_perf", gauges: {}, maintenance: { fluids: true, tires: true, brakes: true } };
  let wear = { engine: 100, tires: 100, brakes: 100, trans: 100 };
  let totalTime = 0;
  for (const segKey of course) {
    const { segTime, newWear } = resolveDecision(segKey, 1, loadout, wear);
    wear = newWear;
    totalTime += segTime;
  }
  return totalTime <= target;
}
let stockWins = 0;
for (let i = 0; i < 4000; i++) if (simulateStockRace(1.30)) stockWins++;
console.log(`stock car, buffer 1.30: win rate ${(100 * stockWins / 4000).toFixed(1)}%`);
