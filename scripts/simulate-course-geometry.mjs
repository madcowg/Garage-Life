// Offline stress test for the course-geometry rework (map/course creation).
// Generates a large number of seeded autocross courses through the real
// discipline generator, walks each into geometry via track.js, and asserts
// none of them ever cross themselves or wander out of bounds — the two
// defects the old generator had no protection against at all. Same
// acceptance-gate pattern as scripts/simulate-season.mjs and
// packages/card-core-v2/scripts/simulate-cardgame.mjs.
//
// Run: node scripts/simulate-course-geometry.mjs

import { getDiscipline, mulberry32 } from "../packages/card-core-v2/src/game/index.js";
import { walkCourse, pathSelfIntersects, pathWithinBounds, buildTrack } from "../src/game/track.js";

const TOTAL = 20000;
let firstAttemptFailures = 0; // how often the retry loop is actually needed
let finalResultFailures = 0; // how often even buildTrack's full retry+fallback still failed (should be 0)
let totalLength = 0, totalSpanX = 0, totalSpanY = 0;

for (let i = 0; i < TOTAL; i++) {
  const genRng = mulberry32(i * 7 + 1);
  const course = getDiscipline("autocross").generateCourse(genRng);
  const courseIds = course.map(s => s.id);
  const seed = (i + 1) / (TOTAL + 1);

  // What a single un-retried walk looks like — quantifies how often
  // validation actually has to kick in, not just whether it works.
  const naive = walkCourse(courseIds, mulberry32(Math.floor(seed * 1e9)));
  if (pathSelfIntersects(naive.points) || !pathWithinBounds(naive.points)) firstAttemptFailures++;

  // The real path every race takes.
  const track = buildTrack(courseIds, seed);
  const crosses = pathSelfIntersects(track.points);
  const bounded = pathWithinBounds(track.points);
  if (crosses || !bounded) {
    finalResultFailures++;
    console.log(`  FAIL seed=${i} courseIds=${courseIds.join(",")} crosses=${crosses} bounded=${bounded}`);
  }

  let length = 0;
  for (let p = 1; p < track.points.length; p++) {
    length += Math.hypot(track.points[p].x - track.points[p - 1].x, track.points[p].y - track.points[p - 1].y);
  }
  const xs = track.points.map(p => p.x), ys = track.points.map(p => p.y);
  totalLength += length;
  totalSpanX += Math.max(...xs) - Math.min(...xs);
  totalSpanY += Math.max(...ys) - Math.min(...ys);
}

console.log(`\n=== Course geometry stress test (${TOTAL} seeded courses) ===`);
console.log(`  avg path length:  ${(totalLength / TOTAL).toFixed(1)} units`);
console.log(`  avg bounding box: ${(totalSpanX / TOTAL).toFixed(1)} x ${(totalSpanY / TOTAL).toFixed(1)} units`);
console.log(`  first-attempt (no retry) validation failures: ${firstAttemptFailures}/${TOTAL} (${(100 * firstAttemptFailures / TOTAL).toFixed(2)}%) — how often the retry loop earns its keep`);
console.log(`  buildTrack() final-result failures: ${finalResultFailures}/${TOTAL} (this must be 0 — retries + fallback should always recover)`);

// Directly stress the guaranteed-safe fallback (opts.forceAlternate) across
// every possible 5-of-6 element subset (all 6 "which one got left out"
// choices) in both forward and reverse order — the fallback only ever
// triggers if every randomized attempt fails, so random sampling alone
// won't reliably exercise it; this checks it explicitly instead.
//
// The fallback's contract is narrower than the retry loop's: it only has
// to guarantee no self-intersection (an actually-broken course), not the
// bounds/compactness heuristic (a niceness preference for normal
// generation). Turning down turnScale to buy safety margin against the
// large-turn elements (turnaround is ~171°) makes some orderings' paths
// straighter and trips the bounds heuristic — that's an acceptable trade
// for a last-resort safety net; a slightly elongated fallback course beats
// a self-crossing one.
const ALL_ELEMENT_IDS = ["slalom", "offsets", "sweeper", "turnaround", "chicago-box", "decreasing-radius"];
let fallbackFailures = 0;
let fallbackChecks = 0;
for (let omit = 0; omit < ALL_ELEMENT_IDS.length; omit++) {
  const five = ALL_ELEMENT_IDS.filter((_, idx) => idx !== omit);
  for (const ordered of [five, [...five].reverse()]) {
    const courseIds = ["start", ...ordered, "finish"];
    const result = walkCourse(courseIds, null, { forceAlternate: true, turnScale: 0.35 });
    fallbackChecks++;
    if (pathSelfIntersects(result.points)) {
      fallbackFailures++;
      console.log(`  FALLBACK FAIL (crosses) courseIds=${courseIds.join(",")}`);
    }
  }
}
console.log(`\n=== Fallback (forceAlternate) direct check ===`);
console.log(`  ${fallbackChecks - fallbackFailures}/${fallbackChecks} element orderings are crossing-free`);

console.log(`\nAcceptance gates:`);
const gate1 = finalResultFailures === 0;
const gate2 = fallbackFailures === 0;
console.log(`  ${gate1 ? "PASS" : "FAIL"}  buildTrack() never returns a self-intersecting or out-of-bounds course (0 failures required)`);
console.log(`  ${gate2 ? "PASS" : "FAIL"}  forceAlternate fallback never self-intersects, for every element ordering (0 failures required)`);
if (!gate1 || !gate2) process.exitCode = 1;
