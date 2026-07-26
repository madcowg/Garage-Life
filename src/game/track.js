// ============================================================================
// TRACK GEOMETRY — turns a course (array of segment keys) into a top-down
// polyline path, turtle-graphics style. Each segment type has a distinct
// shape signature so Hairpin/Sweeper/Slalom/Chicane read differently on
// the map, matching how they play differently in the card game.
// ============================================================================

// Lateral distance (world units) of a boundary cone from the centerline —
// shared with road.js so the pseudo-3D view can project cones at the same
// relative offset the top-down map uses.
export const CONE_EDGE_WIDTH = 26;

const SHAPE = {
  // Legacy segment keys (kept so saved Course Log thumbnails still render)
  launch:  { steps: 7,  stepLen: 20, kind: "straight" },
  finish:  { steps: 7,  stepLen: 20, kind: "straight" },
  hairpin: { steps: 20, stepLen: 8,  kind: "arc", totalTurn: Math.PI * 0.95 },
  sweeper: { steps: 16, stepLen: 13, kind: "arc", totalTurn: Math.PI * 0.42 },
  slalom:  { steps: 18, stepLen: 9,  kind: "wave", cycles: 3 },
  chicane: { steps: 12, stepLen: 11, kind: "esse" },
  // card-core-v2 course elements
  start:                 { steps: 6,  stepLen: 18, kind: "straight" },
  offsets:               { steps: 14, stepLen: 10, kind: "wave", cycles: 2 },
  turnaround:            { steps: 20, stepLen: 8,  kind: "arc", totalTurn: Math.PI * 0.95 },
  "chicago-box":         { steps: 14, stepLen: 10, kind: "esse" },
  "decreasing-radius":   { steps: 18, stepLen: 9,  kind: "arc", totalTurn: Math.PI * 0.75 },
};

// One turtle-graphics walk of a course into centerline points + cone
// markers. Pulled out of buildTrack() so it can be retried with a fresh
// rng stream (or a guaranteed-safe forced direction pattern) when the
// result fails validation — see buildTrack below.
//
// Heading carries continuously from segment to segment — it used to be
// forced back to exactly 0 after every wave/esse shape ("straighten out
// before next segment"), which discarded whatever direction the course had
// actually accumulated from every prior segment, not just that shape's own
// contribution. That's what caused the illogical kinks: the path would
// snap to "pointing up" regardless of where it actually was, violating the
// most basic real-course-design rule ("flow like a river" — adjacent
// sections should connect smoothly, never crossing or kinking). A wave/esse
// shape's own turn already nets to ~0 by construction (symmetric halves /
// complete cycles), so simply not resetting lets the path flow through
// using whatever heading it entered with, small natural residue and all.
export function walkCourse(course, rng, opts = {}) {
  let x = 0, y = 0, heading = 0; // heading: 0 = pointing "up" (negative y)
  const points = [{ x, y }];
  const segMarkers = [];
  const cones = [];
  let altDir = -1; // only used by opts.forceAlternate, the guaranteed-safe fallback pattern
  // Only the guaranteed-safe fallback scales turn angles down (default 1 =
  // full-fidelity shapes). Direction alone doesn't stop a near-U-turn
  // element (turnaround is ~171°) from looping back over itself regardless
  // of alternating pattern — verified false by scripts/simulate-course-
  // geometry.mjs, which is exactly why this exists instead of an assumed
  // "alternating is safe" claim.
  const turnScale = opts.turnScale ?? 1;

  course.forEach((segKey) => {
    const shape = SHAPE[segKey];
    const startIdx = points.length - 1;
    // left/right variety, re-rolled per segment.
    const dir = opts.forceAlternate ? (altDir = -altDir) : (rng() > 0.5 ? 1 : -1);

    if (shape.kind === "straight") {
      for (let i = 0; i < shape.steps; i++) {
        x += Math.sin(heading) * shape.stepLen;
        y -= Math.cos(heading) * shape.stepLen;
        points.push({ x, y });
      }
    } else if (shape.kind === "arc") {
      const turnPerStep = (shape.totalTurn * turnScale / shape.steps) * dir;
      for (let i = 0; i < shape.steps; i++) {
        heading += turnPerStep;
        x += Math.sin(heading) * shape.stepLen;
        y -= Math.cos(heading) * shape.stepLen;
        points.push({ x, y });
      }
    } else if (shape.kind === "wave") {
      const amp = 0.16 * dir;
      for (let i = 0; i < shape.steps; i++) {
        const phase = (i / shape.steps) * Math.PI * 2 * shape.cycles;
        heading += amp * Math.cos(phase);
        x += Math.sin(heading) * shape.stepLen;
        y -= Math.cos(heading) * shape.stepLen;
        points.push({ x, y });
      }
    } else if (shape.kind === "esse") {
      const half = Math.floor(shape.steps / 2);
      const turn = (Math.PI * 0.5 * turnScale) / half;
      for (let i = 0; i < shape.steps; i++) {
        const sign = i < half ? dir : -dir;
        heading += turn * sign;
        x += Math.sin(heading) * shape.stepLen;
        y -= Math.cos(heading) * shape.stepLen;
        points.push({ x, y });
      }
    }

    const endIdx = points.length - 1;
    segMarkers.push({ segKey, startIdx, endIdx });

    // Cone placement, matching real SCCA-style course maps. A real corner is
    // marked by a *handful* of cones — entry, apex, exit — not a continuous
    // double wall down both edges; the earlier version placed a boundary
    // pair every 2-3 steps for the entire arc, which meant ~20 cones for one
    // hairpin alone. Slalom stays single-file gates (already sparse/correct).
    const segPoints = points.slice(startIdx, endIdx + 1);
    if (segKey === "slalom") {
      for (let i = 2; i < segPoints.length - 1; i += 3) {
        cones.push({ x: segPoints[i].x, y: segPoints[i].y, side: "gate", refIdx: startIdx + i });
      }
    } else if (shape.kind === "straight") {
      // Real straights barely need cones — just mark the transition out.
      pushBoundaryPair(cones, segPoints, segPoints.length - 1, startIdx);
    } else if (shape.kind === "arc") {
      pushBoundaryPair(cones, segPoints, 1, startIdx);
      pushBoundaryPair(cones, segPoints, segPoints.length - 1, startIdx);
      pushApexCone(cones, segPoints, Math.floor(segPoints.length / 2), dir, startIdx);
    } else if (shape.kind === "esse") {
      const half = Math.floor(shape.steps / 2);
      pushBoundaryPair(cones, segPoints, 1, startIdx);
      pushBoundaryPair(cones, segPoints, half, startIdx); // direction-change point
      pushBoundaryPair(cones, segPoints, segPoints.length - 1, startIdx);
      pushApexCone(cones, segPoints, Math.floor(half / 2), dir, startIdx);
      pushApexCone(cones, segPoints, Math.floor(half + half / 2), -dir, startIdx);
    }
  });

  return { points, segMarkers, cones };
}

// Two segments (a0->a1) and (b0->b1) properly cross — standard
// orientation/cross-product test.
function cross(a, b, c) { return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x); }
function segmentsIntersect(a0, a1, b0, b1) {
  const d1 = cross(b0, b1, a0), d2 = cross(b0, b1, a1);
  const d3 = cross(a0, a1, b0), d4 = cross(a0, a1, b1);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// A course should never cross itself — called out explicitly as a
// top-level rule in real course-design practice ("avoid crossovers",
// checked at the sketch phase before anything gets built). MARGIN skips
// index-adjacent edges: they share an endpoint and sit naturally close
// together on a tight curve without actually crossing — only genuinely
// far-apart-in-sequence crossings should trip this.
const SELF_INTERSECT_MARGIN = 3;
export function pathSelfIntersects(points) {
  const n = points.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + SELF_INTERSECT_MARGIN; j < n - 1; j++) {
      if (segmentsIntersect(points[i], points[i + 1], points[j], points[j + 1])) return true;
    }
  }
  return false;
}

// Loose sanity backstop, independent of the crossing check above — a
// course that wanders almost as far in one direction as its entire
// pavement length is a degenerate random walk (several same-direction
// turns in a row sending it off in a near-straight line), not a bounded
// lot layout. A non-self-intersecting path can still do this, so it needs
// its own check.
export function pathWithinBounds(points) {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  const b = trackBounds(points);
  const spanX = b.maxX - b.minX, spanY = b.maxY - b.minY;
  return spanX <= length * 0.85 && spanY <= length * 0.85;
}

const MAX_GENERATION_ATTEMPTS = 12;

// Builds the full centerline + per-segment cone markers for one generated
// course. Returns { points: [{x,y}], segMarkers: [{segKey, startIdx, endIdx}], cones: [{x,y,side}] }
// — the single source of truth both the top-down map (MiniMap/TrackCanvas)
// and the pseudo-3D in-race view (RoadView, via road.js's curvature/cone
// projection off these same points/cones) render from, so the two are
// always mechanically in sync for whatever course this returns.
//
// Retries with a fresh rng stream if the walk crosses itself or wanders
// out of bounds (see pathSelfIntersects/pathWithinBounds above); falls
// back to a guaranteed-safe strictly-alternating direction pattern if
// every retry fails (stress-tested in scripts/simulate-course-geometry.mjs
// to confirm this never happens in practice, but the fallback exists so a
// course is always produced regardless).
export function buildTrack(course, seed = Math.random()) {
  const baseSeed = Math.floor(seed * 1e9);
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const rng = mulberry32(baseSeed + attempt * 104729);
    const result = walkCourse(course, rng);
    if (!pathSelfIntersects(result.points) && pathWithinBounds(result.points)) return result;
  }
  return walkCourse(course, mulberry32(baseSeed), { forceAlternate: true, turnScale: 0.35 });
}

// A single left/right boundary cone pair at segPoints[idx] — used sparingly
// (entry/exit/direction-change points only), not continuously along a corner.
function pushBoundaryPair(cones, segPoints, idx, startIdx) {
  const i = clampIdx(idx, 1, segPoints.length - 1);
  const p0 = segPoints[i - 1], p1 = segPoints[i];
  const dx = p1.x - p0.x, dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  cones.push({ x: p1.x + nx * CONE_EDGE_WIDTH, y: p1.y + ny * CONE_EDGE_WIDTH, side: "left", refIdx: startIdx + i });
  cones.push({ x: p1.x - nx * CONE_EDGE_WIDTH, y: p1.y - ny * CONE_EDGE_WIDTH, side: "right", refIdx: startIdx + i });
}

// One inside-of-the-turn "apex" cone at segPoints[idx], marking which way
// (and via CONE_EDGE_WIDTH, roughly how tight) the turn is — same convention
// real course designers use so a driver can read the turn before they're in it.
function pushApexCone(cones, segPoints, idx, dir, startIdx) {
  const i = clampIdx(idx, 1, segPoints.length - 1);
  const p0 = segPoints[i - 1], p1 = segPoints[i];
  const dx = p1.x - p0.x, dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const insideSign = -dir; // dir>0 (clockwise/right turn) -> inside is the right-hand side
  cones.push({
    x: p1.x + nx * insideSign * CONE_EDGE_WIDTH * 0.5,
    y: p1.y + ny * insideSign * CONE_EDGE_WIDTH * 0.5,
    side: "apex", refIdx: startIdx + i,
  });
}

function clampIdx(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Deterministic small PRNG so a saved course can be re-rendered identically from a seed.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Bounding box helper for canvas autoscale/fit.
export function trackBounds(points) {
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

// Shared draw routine — used by the post-race TrackCanvas recap and by
// RoadView's in-race minimap overlay, so every view of a course always
// agrees on its shape. Renders at whatever internal resolution the canvas
// already has; caller controls pixel-chunkiness via canvas size and pad.
export function drawTrack(ctx, track, opts = {}) {
  const {
    width, height, showCones = true, activeSegIndex = -1, carT = 0, palette = {}, pad = 20,
    trackWidth = 2, trackAlpha = 0.6, finishStyle = "checkered", showGateLabels = false,
  } = opts;
  const { points, segMarkers, cones } = track;
  const b = trackBounds(points);
  const spanX = Math.max(1, b.maxX - b.minX);
  const spanY = Math.max(1, b.maxY - b.minY);
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);
  const offX = (width - spanX * scale) / 2 - b.minX * scale;
  const offY = (height - spanY * scale) / 2 - b.minY * scale;
  const tx = (p) => ({ x: p.x * scale + offX, y: p.y * scale + offY });

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = palette.bg || "#0D0D1A";
  ctx.fillRect(0, 0, width, height);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Suggested driving line. Real autocross has no surface markings at all,
  // just cones and chalk — but a post-race recap reads the course shape
  // itself as the main content (no cone clutter to lean on there), so this
  // is a caller-tunable bold/bright line rather than a fixed subtle guide:
  // the small HUD minimap and course-log thumbnails keep the old thin/dim
  // default (they still show cones), while the full recap map cranks
  // trackWidth/trackAlpha up so the line itself is the primary readable
  // element.
  ctx.strokeStyle = palette.track || "#2a2a44";
  ctx.lineWidth = Math.max(1, trackWidth * scale);
  ctx.globalAlpha = trackAlpha;
  ctx.beginPath();
  points.forEach((p, i) => { const q = tx(p); if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); });
  ctx.stroke();
  ctx.globalAlpha = 1;

  // active segment highlight (shows race progress)
  if (activeSegIndex >= 0 && segMarkers[activeSegIndex]) {
    const { startIdx, endIdx } = segMarkers[activeSegIndex];
    ctx.strokeStyle = palette.active || "#FF6EC7";
    ctx.lineWidth = Math.max(1, 4 * scale);
    ctx.beginPath();
    for (let i = startIdx; i <= endIdx; i++) {
      const q = tx(points[i]);
      if (i === startIdx) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
    }
    ctx.stroke();
  }

  // completed segments dimmed-bright trail
  if (activeSegIndex > 0) {
    const { startIdx } = segMarkers[activeSegIndex];
    ctx.strokeStyle = palette.done || "#00F5D4";
    ctx.lineWidth = Math.max(1, 3 * scale);
    ctx.beginPath();
    for (let i = 0; i <= startIdx; i++) {
      const q = tx(points[i]);
      if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
    }
    ctx.stroke();
  }

  // Start (green) and finish gate lines, perpendicular to travel direction at
  // the very first/last point — every real autocross course has both. Finish
  // defaults to the checkered-flag pattern (the tiny in-race HUD minimap and
  // course-log thumbnails still use this); the full recap map instead asks
  // for a plain solid red line — clearer than the checker pattern once the
  // gate is only a few pixels across, and it reads as a clean stop/finish
  // signal opposite the green go/start line.
  if (points.length > 1) {
    drawGateLine(ctx, tx, scale, points[0], points[1], "solid", palette.startLine || "#00C853", showGateLabels ? "START" : null);
    drawGateLine(
      ctx, tx, scale, points[points.length - 2], points[points.length - 1],
      finishStyle === "solid" ? "solid" : "checkered", palette.finishLine || "#FF2D55",
      showGateLabels ? "FINISH" : null,
    );
  }

  // Cones as small dots (real cone color), not squares — apex/pointer cones
  // (one per corner, on the inside of the turn) render brighter and larger
  // so the turn's direction and tightness read at a glance, same as a real
  // course walk or a printed course map. Kept small/sparse so the map stays
  // readable rather than a cluttered wall of dots.
  if (showCones) {
    cones.forEach(c => {
      const q = tx(c);
      const isApex = c.side === "apex";
      ctx.fillStyle = c.side === "gate" ? (palette.gateCone || "#FFD700") : isApex ? (palette.apexCone || "#FF2D55") : (palette.cone || "#FF6B35");
      const r = isApex ? Math.max(1.8, 1.4 * scale) : Math.max(1, 1 * scale);
      ctx.beginPath();
      ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (activeSegIndex >= 0 && segMarkers[activeSegIndex]) {
    const { startIdx, endIdx } = segMarkers[activeSegIndex];
    const idx = Math.round(startIdx + (endIdx - startIdx) * clampNum(carT, 0, 1));
    const p = points[clampNum(idx, 0, points.length - 1)];
    const q = tx(p);
    ctx.fillStyle = palette.car || "#E8EAF6";
    ctx.beginPath();
    ctx.arc(q.x, q.y, Math.max(3, 6 * scale), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = palette.carOutline || "#1A0533";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// Draws a gate line perpendicular to travel direction at p1 (the start or
// finish point), spanning the course width — "solid" is a plain green start
// line, "checkered" is an alternating black/white finish line.
// Below ~8px on screen the gate line all but disappears (found in fewer
// than half of sampled courses at the in-race minimap's tiny size, checked
// directly by scanning rendered pixels) — floor its world-space half-width
// so the ON-SCREEN result never shrinks past that, regardless of how small
// scale gets. At the larger recap/HUD sizes (bigger scale), the natural
// CONE_EDGE_WIDTH-based size is already bigger than this floor, so nothing
// changes there.
const MIN_GATE_SCREEN_HALFW = 8;
// `label` is optional: when given, it's drawn centered on the gate line
// itself, rotated to run along it (see below).
function drawGateLine(ctx, tx, scale, p0, p1, kind, solidColor, label = null) {
  const dx = p1.x - p0.x, dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const halfW = Math.max(CONE_EDGE_WIDTH * 1.1, MIN_GATE_SCREEN_HALFW / scale);
  const lineWidth = Math.max(2, 3 * scale);

  if (kind === "solid") {
    const a = tx({ x: p1.x + nx * halfW, y: p1.y + ny * halfW });
    const b = tx({ x: p1.x - nx * halfW, y: p1.y - ny * halfW });
    ctx.strokeStyle = solidColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  } else {
    const segs = 8;
    for (let i = 0; i < segs; i++) {
      const t0 = -halfW + (2 * halfW) * (i / segs);
      const t1 = -halfW + (2 * halfW) * ((i + 1) / segs);
      const a = tx({ x: p1.x + nx * t0, y: p1.y + ny * t0 });
      const b = tx({ x: p1.x + nx * t1, y: p1.y + ny * t1 });
      ctx.strokeStyle = i % 2 === 0 ? "#111111" : "#E8EAF6";
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  if (label) {
    // Drawn directly on the gate line itself (centered at p1), rotated to
    // run along it — the line is perpendicular to the direction of travel,
    // so the label reads across the course rather than upright and offset
    // to one side. tx() only scales/translates (no rotation), so the
    // world-space line direction (nx,ny) is also the correct screen-space
    // rotation angle.
    const p1s = tx(p1);
    let angle = Math.atan2(ny, nx);
    if (angle > Math.PI / 2) angle -= Math.PI;
    if (angle < -Math.PI / 2) angle += Math.PI;
    ctx.save();
    ctx.translate(p1s.x, p1s.y);
    ctx.rotate(angle);
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#0a0a14";
    ctx.strokeText(label, 0, 0);
    ctx.fillStyle = solidColor;
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
}

function clampNum(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
