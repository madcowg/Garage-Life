// ============================================================================
// PSEUDO-3D ROAD MATH — classic SNES Mode-7 / OutRun-style scanline
// projection. Curvature is derived directly from the already-generated
// track.points (not a separate curve model), so the forward-perspective
// race view always bends the same direction as the top-down minimap for
// the same track.
// ============================================================================

import { CONE_EDGE_WIDTH } from "./track.js";

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function normalizeAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

// Heading (radians, 0 = "up") at a point index, from the direction to the
// next point — same convention track.js uses to walk the turtle graphics.
export function headingAt(points, i) {
  const a = points[clamp(i - 1, 0, points.length - 1)];
  const b = points[clamp(i + 1, 0, points.length - 1)];
  return Math.atan2(b.x - a.x, -(b.y - a.y));
}

// Signed heading delta between consecutive points: positive bends right,
// negative bends left (screen-space; matches track.js's +x/sin(heading)).
export function curvatureAt(points, i) {
  if (i >= points.length - 1) return 0;
  return normalizeAngle(headingAt(points, i + 1) - headingAt(points, i));
}

// Builds the strip of road "rows" ahead of the car for one frame — starting
// at the car's current position within the active segment and reading
// `depth` points further, deliberately overrunning into the next segment's
// points so its upcoming bend is visible before the car reaches it (the
// whole point of the SNES pseudo-3D look).
export function buildRoadStrip(track, activeSegIndex, carT, depth = 46) {
  const { points, segMarkers, cones } = track;
  const marker = segMarkers[activeSegIndex];
  if (!marker) return { rows: [], cones: [], carLean: 0 };

  const { startIdx, endIdx } = marker;
  const span = Math.max(1, endIdx - startIdx);
  const carIdx = Math.floor(startIdx + span * clamp(carT, 0, 1));
  const maxIdx = Math.min(points.length - 1, carIdx + depth);

  const rows = [];
  let cumCurve = 0;
  for (let i = carIdx; i <= maxIdx; i++) {
    cumCurve += curvatureAt(points, i);
    rows.push({ curve: cumCurve });
  }

  const carLean = curvatureAt(points, carIdx);
  const visibleCones = cones
    .filter(c => c.refIdx != null && c.refIdx >= carIdx && c.refIdx <= maxIdx)
    .map(c => ({ ...c, rowOffset: c.refIdx - carIdx, lateral: coneLateralOffset(points, c) }));

  return { rows, cones: visibleCones, carLean };
}

// A cone's signed distance from the centerline at its reference point,
// normalized by the boundary-cone width track.js uses — so a boundary cone
// lands near ±1 (road edge) and a slalom gate cone (placed on the
// centerline) lands at 0, matching how the top-down map places them.
function coneLateralOffset(points, cone) {
  const i = clamp(cone.refIdx, 1, points.length - 2);
  const p0 = points[i - 1], p1 = points[i], p2 = points[i + 1];
  const dx = p2.x - p0.x, dy = p2.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const relX = cone.x - p1.x, relY = cone.y - p1.y;
  return (relX * nx + relY * ny) / CONE_EDGE_WIDTH;
}

// Projects the road strip into screen-space trapezoids, nearest row first.
// Uses an inverse-distance falloff (persp = focal / (focal + i)) rather than
// a power curve on normalized (1-t) — the power-curve version collapsed
// nearly the whole depth window into a few pixels right at the horizon,
// leaving a dead gap of bare background with no road in it, which defeated
// the point of showing the upcoming curve before you reach it.
// curveScale converts *radians* of accumulated curvature into screen pixels.
// A hairpin alone turns ~3 rad; with lookahead into a second segment, total
// accumulated curve can reach ~4-5 rad — curveScale is tuned so that maps to
// roughly a third of the canvas width at the horizon, not thousands of
// pixels (an earlier value of 60 here was an unvalidated placeholder that
// sent far rows completely off-canvas).
export function projectRows(rows, { width, height, horizonY, roadWidth, curveScale = 0.22, focal = 11 }) {
  const n = rows.length;
  if (n === 0) return [];
  const projected = [];
  for (let i = 0; i < n; i++) {
    const persp = focal / (focal + i); // 1 near, asymptotically ->0 far
    const y = horizonY + (height - horizonY) * persp;
    const halfWidth = Math.max(1, (roadWidth / 2) * persp);
    const rawOffset = rows[i].curve * curveScale * (1 - persp) * (width / 2);
    const xOffset = Math.max(-width * 1.5, Math.min(width * 1.5, rawOffset));
    projected.push({ y, halfWidth, xOffset, persp });
  }
  return projected;
}
