// ============================================================================
// TRACK GEOMETRY — turns a course (array of segment keys) into a top-down
// polyline path, turtle-graphics style. Each segment type has a distinct
// shape signature so Hairpin/Sweeper/Slalom/Chicane read differently on
// the map, matching how they play differently in the card game.
// ============================================================================

const SHAPE = {
  launch:  { steps: 7,  stepLen: 20, kind: "straight" },
  finish:  { steps: 7,  stepLen: 20, kind: "straight" },
  hairpin: { steps: 20, stepLen: 8,  kind: "arc", totalTurn: Math.PI * 0.95 },
  sweeper: { steps: 16, stepLen: 13, kind: "arc", totalTurn: Math.PI * 0.42 },
  slalom:  { steps: 18, stepLen: 9,  kind: "wave", cycles: 3 },
  chicane: { steps: 12, stepLen: 11, kind: "esse" },
};

// Builds the full centerline + per-segment cone markers for one generated course.
// Returns { points: [{x,y}], segMarkers: [{segKey, startIdx, endIdx}], cones: [{x,y,side}] }
export function buildTrack(course, seed = Math.random()) {
  let rng = mulberry32(Math.floor(seed * 1e9));
  let x = 0, y = 0, heading = 0; // heading: 0 = pointing "up" (negative y)
  const points = [{ x, y }];
  const segMarkers = [];
  const cones = [];

  course.forEach((segKey) => {
    const shape = SHAPE[segKey];
    const startIdx = points.length - 1;
    const dir = rng() > 0.5 ? 1 : -1; // left/right variety, re-rolled per segment

    if (shape.kind === "straight") {
      for (let i = 0; i < shape.steps; i++) {
        x += Math.sin(heading) * shape.stepLen;
        y -= Math.cos(heading) * shape.stepLen;
        points.push({ x, y });
      }
    } else if (shape.kind === "arc") {
      const turnPerStep = (shape.totalTurn / shape.steps) * dir;
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
      heading = 0; // straighten out before next segment
    } else if (shape.kind === "esse") {
      const half = Math.floor(shape.steps / 2);
      const turn = (Math.PI * 0.5) / half;
      for (let i = 0; i < shape.steps; i++) {
        const sign = i < half ? dir : -dir;
        heading += turn * sign;
        x += Math.sin(heading) * shape.stepLen;
        y -= Math.cos(heading) * shape.stepLen;
        points.push({ x, y });
      }
      heading = 0;
    }

    const endIdx = points.length - 1;
    segMarkers.push({ segKey, startIdx, endIdx });

    // Cone placement: slalom = single-file zigzag gates down the centerline.
    // Everything else = boundary cones along both edges (autocross has no curbs).
    const segPoints = points.slice(startIdx, endIdx + 1);
    if (segKey === "slalom") {
      for (let i = 2; i < segPoints.length - 1; i += 3) {
        cones.push({ x: segPoints[i].x, y: segPoints[i].y, side: "gate" });
      }
    } else {
      for (let i = 1; i < segPoints.length - 1; i += 3) {
        const p0 = segPoints[i - 1], p1 = segPoints[i];
        const dx = p1.x - p0.x, dy = p1.y - p0.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len; // normal
        const width = 26;
        cones.push({ x: p1.x + nx * width, y: p1.y + ny * width, side: "left" });
        cones.push({ x: p1.x - nx * width, y: p1.y - ny * width, side: "right" });
      }
    }
  });

  return { points, segMarkers, cones };
}

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

// Shared draw routine — used by both the full TrackCanvas and the HUD MiniMap
// so the two always agree on shape. Renders at whatever internal resolution
// the canvas already has; caller controls pixel-chunkiness via canvas size.
export function drawTrack(ctx, track, opts = {}) {
  const { width, height, showCones = true, activeSegIndex = -1, carT = 0, palette = {} } = opts;
  const { points, segMarkers, cones } = track;
  const b = trackBounds(points);
  const pad = 20;
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

  // track surface
  ctx.strokeStyle = palette.track || "#2a2a44";
  ctx.lineWidth = Math.max(3, 28 * scale);
  ctx.beginPath();
  points.forEach((p, i) => { const q = tx(p); if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); });
  ctx.stroke();

  // active segment highlight (shows race progress)
  if (activeSegIndex >= 0 && segMarkers[activeSegIndex]) {
    const { startIdx, endIdx } = segMarkers[activeSegIndex];
    ctx.strokeStyle = palette.active || "#FF6EC7";
    ctx.lineWidth = Math.max(2, 14 * scale);
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
    ctx.lineWidth = Math.max(2, 10 * scale);
    ctx.beginPath();
    for (let i = 0; i <= startIdx; i++) {
      const q = tx(points[i]);
      if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
    }
    ctx.stroke();
  }

  if (showCones) {
    cones.forEach(c => {
      const q = tx(c);
      ctx.fillStyle = c.side === "gate" ? (palette.gateCone || "#FFD700") : (palette.cone || "#FF6B35");
      const s = Math.max(2, 3 * scale);
      ctx.fillRect(q.x - s / 2, q.y - s / 2, s, s);
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

function clampNum(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
