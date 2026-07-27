import { useRef, useEffect } from "react";
import { buildRoadStrip, projectRows } from "../game/road";
import { drawTrack } from "../game/track";
import { CARS } from "../game/data";
import { CAR_SPRITES } from "../game/carAssets";

// Forward-perspective "driving" view — SNES Mode-7 style (Mario Kart /
// F-Zero), replacing a flat top-down look for the live race screen. The
// top-down TrackCanvas stays as-is for the post-race course recap; this is
// only the in-race visual, so the player sees the road curving away ahead
// of them instead of a bird's-eye line. The course minimap and elapsed
// time are composited as HUD overlays directly onto this same canvas
// (top-left / top-center) instead of living in a separate panel below —
// same reference-game framing as a real racing HUD.
const INTERNAL_W = 288;
const INTERNAL_H = 176;
const HORIZON_Y = 66;
const ROAD_WIDTH = 168;
const DEPTH = 46;

// Minimap overlay — reuses track.js's shared drawTrack() (same points/cones
// every other view reads from, so it's always geometrically accurate to
// what's actually being driven), rendered to a small offscreen canvas and
// composited into the corner. pad is much smaller than the full-size
// HUD/recap map's default (20px) — at ~70px across that would eat most of
// the canvas.
const MINI_W = 62, MINI_H = 74, MINI_PAD = 5, MINI_MARGIN = 6;
// Single car for now (solo autocross) — the dot is sized/colored for a
// player car. Multiple simultaneous cars (future disciplines with other
// participants) would extend drawTrack's car-marker drawing to accept a
// list of {point, color, size} instead of the one it draws today; no
// consumer needs that yet, so it isn't built speculatively here.

// Every car (including beaterVan now) renders from CAR_SPRITES; this set is
// the escape hatch for a future car that ships without art — drawCarSprite
// already falls back to the procedural draw automatically if a sprite fails
// to load, so nothing needs to be forced into it today.
const FORCE_PROCEDURAL = new Set([]);

const CAR_PALETTES = {
  miataNA:  { body: "#D0233B", dark: "#7A0F22", glass: "#1B2233", tail: "#FF2D55", trim: "#2b0d14" },
  miataNB:  { body: "#C7CCD6", dark: "#7F8798", glass: "#1B2233", tail: "#FF2D55", trim: "#4a4f58" },
  integra:  { body: "#E7E9EE", dark: "#9AA0AC", glass: "#161B26", tail: "#FF2D55", amber: "#FFB300", trim: "#5b5f68" },
  corvette: { body: "#CE1F2A", dark: "#7A0F16", glass: "#12151D", tail: "#FF2D55", trim: "#120608" },
  // Secondhand cargo-van paint job: faded, patchy, no two panels quite the
  // same color — trim doubles as the duct-tape patch color.
  beaterVan: { body: "#8C9A6B", dark: "#5B6644", glass: "#1B2233", tail: "#FF6B35", trim: "#B8B0A0" },
};

// The minimap's player dot matches the car's actual body color, same idea
// as the reference HUD (dot color = car color). Unlockable JDM roster
// (sprite-based, no procedural palette) falls back to the HUD teal accent.
function carDotColor(carId, variant) {
  if (carId === "miata") return variant === "NB" ? CAR_PALETTES.miataNB.body : CAR_PALETTES.miataNA.body;
  if (carId === "integra") return CAR_PALETTES.integra.body;
  if (carId === "corvette") return CAR_PALETTES.corvette.body;
  if (carId === "beaterVan") return CAR_PALETTES.beaterVan.body;
  return "#16F2D6";
}

// Module-level image cache — preloaded once, shared across every RoadView
// instance/render, since Image() loads asynchronously and we don't want to
// re-kick a network request every frame or every remount.
const spriteCache = {};
function spriteKeyFor(carId, variant) {
  const car = CARS[carId];
  if (!car) return null;
  if (variant && car.spriteVariants?.[variant]) return car.spriteVariants[variant];
  return car.sprite || null;
}
function loadSprite(carId, variant) {
  const key = spriteKeyFor(carId, variant);
  if (!key) return null;
  if (!spriteCache[key]) {
    const img = new Image();
    img.src = CAR_SPRITES[key].rear;
    // Compute the non-transparent content box once on load — sprite sources
    // vary (96×64 full-bleed pack art vs. 96/104px square PixelLab exports
    // with large transparent margins), and drawing the full canvas made the
    // padded ones render comically oversized/mispositioned.
    img.onload = () => { img.__bbox = contentBBox(img); };
    spriteCache[key] = img;
  }
  return spriteCache[key];
}

function contentBBox(img) {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  let minX = c.width, minY = c.height, maxX = -1, maxY = -1;
  for (let py = 0; py < c.height; py++) {
    for (let px = 0; px < c.width; px++) {
      if (d[(py * c.width + px) * 4 + 3] > 8) {
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w: c.width, h: c.height };
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export default function RoadView({ track, activeSegIndex, carT, carId = "miata", variant, theme = "default", totalTime = 0, targetTime = 0, suspensionMod = false }) {
  const canvasRef = useRef(null);
  // Lazily-created offscreen canvas the minimap draws into each frame, then
  // gets composited onto the main canvas — keeps drawTrack()'s own
  // clearRect/fillRect fully self-contained instead of fighting the main
  // canvas's road/sky drawing for the same pixels.
  const miniCanvasRef = useRef(null);
  if (!miniCanvasRef.current) {
    const c = document.createElement("canvas");
    c.width = MINI_W;
    c.height = MINI_H;
    miniCanvasRef.current = c;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    const strip = buildRoadStrip(track, activeSegIndex, carT, DEPTH);
    const rows = projectRows(strip.rows, {
      width: INTERNAL_W, height: INTERNAL_H, horizonY: HORIZON_Y, roadWidth: ROAD_WIDTH,
    });
    const hud = { track, activeSegIndex, carT, totalTime, targetTime, miniCanvas: miniCanvasRef.current, carColor: carDotColor(carId, variant) };
    // Draw once synchronously so the frame shows up immediately even if the
    // tab/pane isn't actively compositing yet (rAF alone can be suspended
    // until the page is visible) — then hand off to rAF for the cosmetic
    // scroll/bob animation on top of this same static geometry.
    const totalSegments = track.segMarkers.length;
    let tick = 0;
    drawFrame(ctx, rows, strip, tick, carId, variant, theme, hud, suspensionMod, activeSegIndex, totalSegments);

    let running = true;
    let raf;
    const frame = () => {
      if (!running) return;
      tick += 1;
      drawFrame(ctx, rows, strip, tick, carId, variant, theme, hud, suspensionMod, activeSegIndex, totalSegments);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { running = false; cancelAnimationFrame(raf); };
  }, [track, activeSegIndex, carT, carId, variant, theme, totalTime, targetTime, suspensionMod]);

  return (
    <div style={{
      position: "relative", border: "3px solid var(--gl-border)", borderRadius: 4, overflow: "hidden",
      boxShadow: "0 0 24px rgba(255,92,200,0.15)", background: "var(--gl-panel-sunk)",
    }}>
      <canvas
        ref={canvasRef}
        width={INTERNAL_W}
        height={INTERNAL_H}
        style={{ width: "100%", height: "auto", display: "block", imageRendering: "pixelated" }}
      />
    </div>
  );
}

function drawFrame(ctx, rows, strip, tick, carId, variant, theme, hud, suspensionMod, activeSegIndex, totalSegments) {
  const W = INTERNAL_W, H = INTERNAL_H;
  ctx.clearRect(0, 0, W, H);

  drawSky(ctx, W, theme);
  drawGroundAndRoad(ctx, rows, tick);
  drawTracksideScenery(ctx, rows, activeSegIndex, totalSegments);
  drawCones(ctx, rows, strip.cones);
  drawCarSprite(ctx, W, H, strip.carLean, tick, carId, variant, suspensionMod);
  drawHudOverlay(ctx, W, hud);
}

// Rough placeholder scenery — parked cars and the event trailer flank the
// grid during the start segment, a timing-light gantry marks the finish
// during the last one. Placed at a strip row so they scale/curve with the
// same perspective the road itself uses. Flat-color silhouettes, same
// "chunky, no gradients" treatment as the palm trees/cones, until real art
// exists for them.
function drawTracksideScenery(ctx, rows, activeSegIndex, totalSegments) {
  if (rows.length === 0) return;
  const W = INTERNAL_W;
  if (activeSegIndex === 0) {
    const row = rows[Math.min(rows.length - 1, Math.floor(rows.length * 0.55))];
    const cx = W / 2 + row.xOffset;
    drawParkedCar(ctx, cx - row.halfWidth - 10, row.y, row.persp);
    drawParkedCar(ctx, cx - row.halfWidth - 20, row.y, row.persp);
    drawTrailer(ctx, cx + row.halfWidth + 14, row.y, row.persp);
  }
  if (totalSegments > 0 && activeSegIndex === totalSegments - 1) {
    const row = rows[rows.length - 1];
    const cx = W / 2 + row.xOffset;
    drawTimingGantry(ctx, cx, row.y, row.halfWidth, row.persp);
  }
}

function drawParkedCar(ctx, x, y, persp) {
  const scale = Math.max(0.18, persp);
  const w = 15 * scale, h = 7 * scale;
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(x - w / 2, y - 1, w, 2);
  ctx.fillStyle = "#3A3A52";
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.fillStyle = "#1B2233";
  ctx.fillRect(x - w * 0.3, y - h, w * 0.6, h * 0.55);
}

function drawTrailer(ctx, x, y, persp) {
  const scale = Math.max(0.18, persp);
  const w = 24 * scale, h = 11 * scale;
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(x - w / 2, y - 1, w, 2);
  ctx.fillStyle = "#9A9AA8";
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.fillStyle = "#6A6A78";
  ctx.fillRect(x - w / 2, y - h, w, h * 0.22);
  ctx.fillStyle = "#FF6B35";
  ctx.fillRect(x - w / 2, y - h * 0.3, w * 0.18, h * 0.3);
}

function drawTimingGantry(ctx, cx, y, halfWidth, persp) {
  const scale = Math.max(0.22, persp);
  const postH = 28 * scale;
  const barY = y - postH;
  ctx.strokeStyle = "#C9C9D6";
  ctx.lineWidth = Math.max(1, 2 * scale);
  ctx.beginPath();
  ctx.moveTo(cx - halfWidth, y); ctx.lineTo(cx - halfWidth, barY);
  ctx.moveTo(cx + halfWidth, y); ctx.lineTo(cx + halfWidth, barY);
  ctx.moveTo(cx - halfWidth, barY); ctx.lineTo(cx + halfWidth, barY);
  ctx.stroke();
  ctx.fillStyle = "#FFC93C";
  const lampW = Math.max(2, 4 * scale);
  ctx.fillRect(cx - halfWidth * 0.5 - lampW / 2, barY, lampW, lampW);
  ctx.fillRect(cx + halfWidth * 0.5 - lampW / 2, barY, lampW, lampW);
}

// Translucent rounded panel used by every HUD element drawn on top of the
// road view — same treatment for the minimap corner and the time pill so
// they read as one consistent HUD, not two different UI styles bolted on.
function drawHudPanel(ctx, x, y, w, h, r = 4, fill = "rgba(11,10,30,0.62)", border = "rgba(22,242,214,0.35)") {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Course minimap (top-left) + elapsed/target time (top-center), composited
// straight onto the race view instead of a separate panel below it — the
// "more race game feel" the reference HUD has. The minimap reuses the same
// drawTrack() the post-race recap uses, so it's always geometrically
// accurate to the actual course, right down to the start (green) / finish
// (red) gate lines already drawn into every track — autocross start and
// finish are almost never the same spot, so both stay explicitly marked
// rather than assuming a closed lap. Same bold-line/solid-red-finish style
// as the post-race recap map (track.js's drawTrack), just without the
// START/FINISH text labels — this canvas is too small for legible text.
function drawHudOverlay(ctx, W, hud) {
  if (!hud?.track) return;
  const { track, activeSegIndex, carT, totalTime, targetTime, miniCanvas, carColor } = hud;

  const mctx = miniCanvas.getContext("2d");
  mctx.imageSmoothingEnabled = false;
  // Clean schematic outline only — no cone dots. A tiny corner minimap reads
  // as course shape + car position at a glance; cone clutter (boundary/gate/
  // apex markers) belongs on the full post-race recap map, not here.
  drawTrack(mctx, track, {
    width: MINI_W, height: MINI_H, pad: MINI_PAD, showCones: false, activeSegIndex, carT,
    trackWidth: 2.5, trackAlpha: 1, finishStyle: "solid",
    palette: {
      bg: "rgba(13,13,26,0.001)", track: "#F2F2EC", active: "#FF6EC7", done: "#00594F",
      car: carColor, carOutline: "#0a0a14", startLine: "#00C853", finishLine: "#FF2D55",
    },
  });

  const panelW = MINI_W + 6, panelH = MINI_H + 6;
  drawHudPanel(ctx, MINI_MARGIN, MINI_MARGIN, panelW, panelH);
  ctx.drawImage(miniCanvas, MINI_MARGIN + 3, MINI_MARGIN + 3);

  // Run timer, top-center — DSEG7 LCD plate per the design doc's instrument
  // spec: dark tinted green well, darker green frame, digits glow the same
  // hue. Target stays a small plain-mono readout underneath (two numeric
  // colors max on screen at once — green owns the primary reading).
  const timeText = `${totalTime.toFixed(2)}s`;
  const targetText = `/ ${targetTime.toFixed(1)}s`;
  ctx.font = "italic 13px 'DSEG7 Classic', monospace";
  const timeW = ctx.measureText(timeText).width;
  ctx.font = "8px monospace";
  const targetW = ctx.measureText(targetText).width;
  const pillW = Math.max(timeW, targetW) + 20;
  const pillH = 28;
  const pillX = W / 2 - pillW / 2;
  const pillY = MINI_MARGIN;
  drawHudPanel(ctx, pillX, pillY, pillW, pillH, 4, "rgba(10,32,26,0.78)", "rgba(34,227,154,0.55)");
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(34,227,154,0.65)";
  ctx.shadowBlur = 4;
  ctx.fillStyle = "#22E39A";
  ctx.font = "italic 13px 'DSEG7 Classic', monospace";
  ctx.fillText(timeText, W / 2, pillY + 15);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#9D8FBD";
  ctx.font = "8px monospace";
  ctx.fillText(targetText, W / 2, pillY + 25);
  ctx.textAlign = "left";
}

// "palm" theme adds Outrun-style palm silhouettes against the sunset for a
// couple of courses through the season — pure scenery, no gameplay effect.
function drawSky(ctx, W, theme) {
  const g = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
  g.addColorStop(0, "#1A0533");
  g.addColorStop(0.55, "#7B2FBE");
  g.addColorStop(1, "#FF6B35");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, HORIZON_Y);

  ctx.fillStyle = "#FFD700";
  ctx.beginPath();
  ctx.arc(W / 2, HORIZON_Y - 2, 14, 0, Math.PI * 2);
  ctx.fill();

  if (theme === "palm") {
    drawPalmTree(ctx, W * 0.14, HORIZON_Y, 1);
    drawPalmTree(ctx, W * 0.88, HORIZON_Y, -1);
  }
}

// Simple silhouette: curved trunk + a few frond strokes, dark against the
// sunset, low internal resolution so it stays chunky rather than smooth.
function drawPalmTree(ctx, baseX, baseY, dir) {
  ctx.fillStyle = "#150220";
  ctx.beginPath();
  ctx.moveTo(baseX - 2, baseY);
  ctx.quadraticCurveTo(baseX + dir * 6, baseY - 16, baseX + dir * 3, baseY - 26);
  ctx.lineTo(baseX + dir * 5, baseY - 26);
  ctx.quadraticCurveTo(baseX + dir * 8, baseY - 15, baseX + 2, baseY);
  ctx.closePath();
  ctx.fill();

  const frondBaseX = baseX + dir * 3, frondBaseY = baseY - 26;
  [-1, -0.4, 0.3, 0.9].forEach(a => {
    ctx.strokeStyle = "#150220";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(frondBaseX, frondBaseY);
    ctx.quadraticCurveTo(
      frondBaseX + dir * 10 * (1 + a * 0.3), frondBaseY - 4,
      frondBaseX + dir * 14 * a, frondBaseY + 4 + Math.abs(a) * 3,
    );
    ctx.stroke();
  });
}

function drawGroundAndRoad(ctx, rows, tick) {
  const W = INTERNAL_W, H = INTERNAL_H;
  ctx.fillStyle = "#12122A";
  ctx.fillRect(0, HORIZON_Y, W, H - HORIZON_Y);

  const n = rows.length;
  for (let i = n - 1; i >= 0; i--) {
    const row = rows[i];
    const next = rows[i - 1] || { y: H };
    const bandH = Math.max(1, next.y - row.y + 1);
    const stripe = Math.floor((n - i) / 3 + tick * 0.15) % 2 === 0;
    const cx = W / 2 + row.xOffset;

    ctx.fillStyle = stripe ? "#141428" : "#0d0d1e";
    ctx.fillRect(0, row.y, W, bandH);

    ctx.fillStyle = stripe ? "#2A2A44" : "#242440";
    ctx.fillRect(cx - row.halfWidth, row.y, row.halfWidth * 2, bandH);

    // Boundary marking: autocross courses use a painted chalk line, never a
    // curb/rumble strip (there's no curbing on a parking-lot course) — so
    // this stays a single chalk-white color, just alternating bright/dim for
    // the same scrolling-motion read a curb stripe would have given.
    const chalkW = Math.max(1, row.halfWidth * 0.07);
    ctx.fillStyle = stripe ? "#F2F2EC" : "rgba(242,242,236,0.4)";
    ctx.fillRect(cx - row.halfWidth - chalkW, row.y, chalkW, bandH);
    ctx.fillRect(cx + row.halfWidth, row.y, chalkW, bandH);
  }
}

// Tapered traffic-cone silhouette (triangle body + stripe band) instead of a
// flat rectangle — stays chunky/low-res, just reads as an actual cone. Every
// cone is the same standard pylon orange regardless of role (boundary, gate,
// apex): real autocross doesn't color-code cones by function, it's cones and
// chalk only, so a gate cone on course looks identical to a boundary cone.
function drawCones(ctx, rows, cones) {
  const W = INTERNAL_W;
  cones.forEach(c => {
    const i = Math.max(0, Math.min(rows.length - 1, c.rowOffset));
    const row = rows[i];
    if (!row) return;
    const cx = W / 2 + row.xOffset + c.lateral * row.halfWidth;
    const h = Math.max(3, row.halfWidth * 0.22);
    const baseW = h * 0.62;
    const baseY = row.y;
    const topY = row.y - h;

    ctx.fillStyle = "#FF6B35";
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx + baseW / 2, baseY);
    ctx.lineTo(cx - baseW / 2, baseY);
    ctx.closePath();
    ctx.fill();

    const stripeY = topY + h * 0.45;
    const stripeHalfW = (baseW / 2) * 0.55;
    ctx.fillStyle = "#E8EAF6";
    ctx.fillRect(cx - stripeHalfW, stripeY, stripeHalfW * 2, Math.max(1, h * 0.12));
  });
}

// Rear-3/4 car sprite, leaning into the upcoming curve and bobbing slightly
// so the "running car" reads as alive rather than a static decal. Every car
// draws its real PNG sprite once it's loaded; the hand-drawn shapes below
// (drawMiataRear/drawIntegraRear/drawCorvetteRear/drawVanRear) only fire as
// an automatic fallback — before the image finishes loading, or if it 404s.
// Stage 1 Suspension (anti-sway bars) cuts body roll roughly in half —
// same "advantage on mistake rolls" upgrade, now visible in the corner too.
const SUSPENSION_MOD_LEAN_SCALE = 0.5;

function drawCarSprite(ctx, W, H, carLean, tick, carId, variant, suspensionMod = false) {
  const bob = Math.sin(tick * 0.12) * 1.2;
  const leanScale = suspensionMod ? SUSPENSION_MOD_LEAN_SCALE : 1;
  const lean = Math.max(-0.35, Math.min(0.35, carLean * 6)) * leanScale;
  const cx = W / 2 - lean * 30;

  if (!FORCE_PROCEDURAL.has(carId)) {
    const img = loadSprite(carId, variant);
    if (img && img.complete && img.naturalWidth > 0) {
      drawSpriteCar(ctx, img, cx, H, bob, lean);
      return;
    }
  }
  drawProceduralCar(ctx, carId, variant, cx, H - 30 + bob, lean);
}

function drawSpriteCar(ctx, img, cx, H, bob, lean) {
  const bb = img.__bbox || { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
  // Scale the car's actual content (not its padded canvas) to a fixed
  // on-road width, anchored just above the bottom edge.
  const w = 72;
  const h = w * (bb.h / bb.w);
  const baseY = H - 12 + bob;

  ctx.save();
  ctx.translate(cx, baseY);
  // Body roll leans AWAY from the turn (cornering G-force, not steering
  // angle) — canvas rotate() is clockwise-positive, so a positive (rightward)
  // lean needs a negative rotation to tip the roofline left/outward.
  ctx.rotate(-lean * 0.25);

  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.42, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.drawImage(img, bb.x, bb.y, bb.w, bb.h, -w / 2, -h, w, h);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function drawWheelsAndShadow(ctx, w, len) {
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(0, len * 0.34, w * 0.58, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0a14";
  ctx.fillRect(-w / 2 - 3, len * 0.05, 7, 12);
  ctx.fillRect(w / 2 - 4, len * 0.05, 7, 12);
}

// Rounded roadster body with a soft-top hump and small taillights inset from
// the edges (not full-width) — the Miata's rear signature, per reference.
// NA (pop-up era) and NB (fixed lights) share this rear silhouette; the
// distinguishing pop-up-vs-fixed headlights aren't visible from behind, so
// they're told apart by body color (red NA / silver NB) as in-game already.
function drawMiataRear(ctx, w, len, p) {
  drawWheelsAndShadow(ctx, w, len);

  ctx.fillStyle = p.body;
  ctx.beginPath();
  ctx.moveTo(-w * 0.28, -len * 0.5);
  ctx.quadraticCurveTo(-w * 0.5, -len * 0.25, -w * 0.48, len * 0.05);
  ctx.quadraticCurveTo(-w * 0.46, len * 0.28, -w * 0.2, len * 0.34);
  ctx.lineTo(w * 0.2, len * 0.34);
  ctx.quadraticCurveTo(w * 0.46, len * 0.28, w * 0.48, len * 0.05);
  ctx.quadraticCurveTo(w * 0.5, -len * 0.25, w * 0.28, -len * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = p.dark;
  ctx.beginPath();
  ctx.ellipse(0, -len * 0.4, w * 0.24, len * 0.14, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = p.glass;
  ctx.fillRect(-w * 0.16, -len * 0.34, w * 0.32, len * 0.12);

  ctx.fillStyle = p.tail;
  roundRect(ctx, -w * 0.42, -len * 0.02, w * 0.14, len * 0.12, 2);
  roundRect(ctx, w * 0.28, -len * 0.02, w * 0.14, len * 0.12, 2);
}

// Boxier notchback (real trunk, not a hatch), trunk-lip spoiler, and wide
// taillight clusters spanning most of the rear width with an amber outer
// segment — per the DC2 GS-R reference.
function drawIntegraRear(ctx, w, len, p) {
  drawWheelsAndShadow(ctx, w, len);

  ctx.fillStyle = p.body;
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, -len * 0.55);
  ctx.lineTo(w * 0.3, -len * 0.55);
  ctx.lineTo(w * 0.5, len * 0.1);
  ctx.lineTo(w * 0.46, len * 0.3);
  ctx.lineTo(-w * 0.46, len * 0.3);
  ctx.lineTo(-w * 0.5, len * 0.1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = p.dark;
  ctx.fillRect(-w * 0.34, -len * 0.02, w * 0.68, len * 0.04);
  ctx.fillStyle = p.glass;
  ctx.fillRect(-w * 0.24, -len * 0.5, w * 0.48, len * 0.22);

  ctx.fillStyle = p.tail;
  ctx.fillRect(-w * 0.46, len * 0.02, w * 0.24, len * 0.14);
  ctx.fillRect(w * 0.22, len * 0.02, w * 0.24, len * 0.14);
  ctx.fillStyle = p.amber;
  ctx.fillRect(-w * 0.46, len * 0.02, w * 0.08, len * 0.14);
  ctx.fillRect(w * 0.38, len * 0.02, w * 0.08, len * 0.14);
}

// Wide, low, flared rear with the signature quad round taillights (2 per
// side), a black diffuser/valence bar, and center exhaust tips — per the
// C6 reference photos.
function drawCorvetteRear(ctx, w, len, p) {
  drawWheelsAndShadow(ctx, w, len);

  ctx.fillStyle = p.body;
  ctx.beginPath();
  ctx.moveTo(-w * 0.26, -len * 0.5);
  ctx.lineTo(w * 0.26, -len * 0.5);
  ctx.quadraticCurveTo(w * 0.52, -len * 0.1, w * 0.5, len * 0.22);
  ctx.lineTo(-w * 0.5, len * 0.22);
  ctx.quadraticCurveTo(-w * 0.52, -len * 0.1, -w * 0.26, -len * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = p.glass;
  ctx.fillRect(-w * 0.2, -len * 0.46, w * 0.4, len * 0.16);
  ctx.fillStyle = p.trim;
  ctx.fillRect(-w * 0.46, len * 0.1, w * 0.92, len * 0.1);

  ctx.fillStyle = p.tail;
  [-0.4, -0.26, 0.26, 0.4].forEach(o => {
    ctx.beginPath();
    ctx.arc(w * o, -len * 0.02, w * 0.055, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#888";
  [-0.06, 0.06].forEach(o => {
    ctx.beginPath();
    ctx.arc(w * o, len * 0.16, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Boxy cargo-van rear: tall and flat (no fastback taper at all), a lifted
// rear-door seam down the middle, small worn taillights, and a strip of
// duct tape holding on a cracked rear window — the whole joke is that it's
// visibly the cheapest possible shape on the roster.
function drawVanRear(ctx, w, len, p) {
  drawWheelsAndShadow(ctx, w, len);

  ctx.fillStyle = p.body;
  ctx.beginPath();
  ctx.moveTo(-w * 0.48, -len * 0.56);
  ctx.lineTo(w * 0.48, -len * 0.56);
  ctx.lineTo(w * 0.48, len * 0.32);
  ctx.lineTo(-w * 0.48, len * 0.32);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = p.dark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -len * 0.5);
  ctx.lineTo(0, len * 0.28);
  ctx.stroke();

  ctx.fillStyle = p.glass;
  ctx.fillRect(-w * 0.34, -len * 0.48, w * 0.68, len * 0.22);
  ctx.fillStyle = p.trim;
  ctx.fillRect(-w * 0.1, -len * 0.4, w * 0.22, len * 0.08);

  ctx.fillStyle = p.tail;
  roundRect(ctx, -w * 0.44, -len * 0.02, w * 0.16, len * 0.14, 2);
  roundRect(ctx, w * 0.28, -len * 0.02, w * 0.16, len * 0.14, 2);
}

function drawProceduralCar(ctx, carId, variant, cx, cy, lean) {
  ctx.save();
  ctx.translate(cx, cy);
  // Same outward-lean correction as the sprite path above.
  ctx.rotate(-lean * 0.4);

  if (carId === "miata") {
    drawMiataRear(ctx, 34, 24, variant === "NB" ? CAR_PALETTES.miataNB : CAR_PALETTES.miataNA);
  } else if (carId === "integra") {
    drawIntegraRear(ctx, 38, 26, CAR_PALETTES.integra);
  } else if (carId === "corvette") {
    drawCorvetteRear(ctx, 44, 26, CAR_PALETTES.corvette);
  } else if (carId === "beaterVan") {
    drawVanRear(ctx, 36, 30, CAR_PALETTES.beaterVan);
  } else {
    // Defensive fallback for any future car with neither a sprite nor a
    // dedicated procedural shape yet — shouldn't trigger with the current roster.
    drawWheelsAndShadow(ctx, 34, 24);
    ctx.fillStyle = "#00F5D4";
    ctx.fillRect(-15, -12, 30, 22);
  }

  ctx.restore();
}
