import { useRef, useEffect } from "react";
import { buildRoadStrip, projectRows } from "../game/road";
import { drawTrack } from "../game/track";
import { CARS } from "../game/data";
import { CAR_SPRITES } from "../game/carAssets";
import { SCANLINE_OVERLAY, scanlinesEnabled } from "../theme";

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

// Integra/Corvette still use hand-coded procedural art: their original PNGs
// were flagged as inaccurate, and regenerating them via PixelLab stalled on
// exhausted account credits. The Miata NA/NB now have accurate
// PixelLab-generated PNGs (installed as race-rear.png) and render as
// sprites. Drop cars from this set as their corrected PNGs arrive.
const FORCE_PROCEDURAL = new Set(["integra", "corvette"]);

const CAR_PALETTES = {
  miataNA:  { body: "#D0233B", dark: "#7A0F22", glass: "#1B2233", tail: "#FF2D55", trim: "#2b0d14" },
  miataNB:  { body: "#C7CCD6", dark: "#7F8798", glass: "#1B2233", tail: "#FF2D55", trim: "#4a4f58" },
  integra:  { body: "#E7E9EE", dark: "#9AA0AC", glass: "#161B26", tail: "#FF2D55", amber: "#FFB300", trim: "#5b5f68" },
  corvette: { body: "#CE1F2A", dark: "#7A0F16", glass: "#12151D", tail: "#FF2D55", trim: "#120608" },
};

// The minimap's player dot matches the car's actual body color, same idea
// as the reference HUD (dot color = car color). Unlockable JDM roster
// (sprite-based, no procedural palette) falls back to the HUD teal accent.
function carDotColor(carId, variant) {
  if (carId === "miata") return variant === "NB" ? CAR_PALETTES.miataNB.body : CAR_PALETTES.miataNA.body;
  if (carId === "integra") return CAR_PALETTES.integra.body;
  if (carId === "corvette") return CAR_PALETTES.corvette.body;
  return "#00F5D4";
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

export default function RoadView({ track, activeSegIndex, carT, carId = "miata", variant, theme = "default", totalTime = 0, targetTime = 0 }) {
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
    let tick = 0;
    drawFrame(ctx, rows, strip, tick, carId, variant, theme, hud);

    let running = true;
    let raf;
    const frame = () => {
      if (!running) return;
      tick += 1;
      drawFrame(ctx, rows, strip, tick, carId, variant, theme, hud);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { running = false; cancelAnimationFrame(raf); };
  }, [track, activeSegIndex, carT, carId, variant, theme, totalTime, targetTime]);

  return (
    <div style={{
      position: "relative", border: "3px solid #2A2A44", borderRadius: 4, overflow: "hidden",
      boxShadow: "0 0 24px rgba(255,110,199,0.15)", background: "#0D0D1A",
    }}>
      <canvas
        ref={canvasRef}
        width={INTERNAL_W}
        height={INTERNAL_H}
        style={{ width: "100%", height: "auto", display: "block", imageRendering: "pixelated" }}
      />
      {scanlinesEnabled() && <div style={SCANLINE_OVERLAY} />}
    </div>
  );
}

function drawFrame(ctx, rows, strip, tick, carId, variant, theme, hud) {
  const W = INTERNAL_W, H = INTERNAL_H;
  ctx.clearRect(0, 0, W, H);

  drawSky(ctx, W, theme);
  drawGroundAndRoad(ctx, rows, tick);
  drawCones(ctx, rows, strip.cones);
  drawCarSprite(ctx, W, H, strip.carLean, tick, carId, variant);
  drawHudOverlay(ctx, W, hud);
}

// Translucent rounded panel used by every HUD element drawn on top of the
// road view — same treatment for the minimap corner and the time pill so
// they read as one consistent HUD, not two different UI styles bolted on.
function drawHudPanel(ctx, x, y, w, h, r = 4) {
  ctx.fillStyle = "rgba(10,10,20,0.62)";
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = "rgba(0,245,212,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
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
  drawTrack(mctx, track, {
    width: MINI_W, height: MINI_H, pad: MINI_PAD, showCones: true, activeSegIndex, carT,
    trackWidth: 2.5, trackAlpha: 1, finishStyle: "solid",
    palette: {
      bg: "rgba(13,13,26,0.001)", track: "#F2F2EC", active: "#FF6EC7", done: "#00594F",
      cone: "#FF6B35", gateCone: "#FFD700", apexCone: "#FF2D55",
      car: carColor, carOutline: "#0a0a14", startLine: "#00C853", finishLine: "#FF2D55",
    },
  });

  const panelW = MINI_W + 6, panelH = MINI_H + 6;
  drawHudPanel(ctx, MINI_MARGIN, MINI_MARGIN, panelW, panelH);
  ctx.drawImage(miniCanvas, MINI_MARGIN + 3, MINI_MARGIN + 3);

  // Elapsed / target time, top-center.
  const timeText = `${totalTime.toFixed(2)}s`;
  const targetText = `/ ${targetTime.toFixed(1)}s`;
  ctx.font = "bold 11px monospace";
  const timeW = ctx.measureText(timeText).width;
  ctx.font = "8px monospace";
  const targetW = ctx.measureText(targetText).width;
  const pillW = Math.max(timeW, targetW) + 20;
  const pillH = 26;
  const pillX = W / 2 - pillW / 2;
  const pillY = MINI_MARGIN;
  drawHudPanel(ctx, pillX, pillY, pillW, pillH);
  ctx.textAlign = "center";
  ctx.fillStyle = "#E8EAF6";
  ctx.font = "bold 11px monospace";
  ctx.fillText(timeText, W / 2, pillY + 12);
  ctx.fillStyle = "#FFD700";
  ctx.font = "8px monospace";
  ctx.fillText(targetText, W / 2, pillY + 22);
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
// so the "running car" reads as alive rather than a static decal. Starters
// (Miata/Integra/Corvette) always use the reference-informed procedural
// shapes below; the unlockable JDM roster draws its real PNG sprite.
function drawCarSprite(ctx, W, H, carLean, tick, carId, variant) {
  const bob = Math.sin(tick * 0.12) * 1.2;
  const lean = Math.max(-0.35, Math.min(0.35, carLean * 6));
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
  ctx.rotate(lean * 0.25);

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

function drawProceduralCar(ctx, carId, variant, cx, cy, lean) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(lean * 0.4);

  if (carId === "miata") {
    drawMiataRear(ctx, 34, 24, variant === "NB" ? CAR_PALETTES.miataNB : CAR_PALETTES.miataNA);
  } else if (carId === "integra") {
    drawIntegraRear(ctx, 38, 26, CAR_PALETTES.integra);
  } else if (carId === "corvette") {
    drawCorvetteRear(ctx, 44, 26, CAR_PALETTES.corvette);
  } else {
    // Defensive fallback for any future car with neither a sprite nor a
    // dedicated procedural shape yet — shouldn't trigger with the current roster.
    drawWheelsAndShadow(ctx, 34, 24);
    ctx.fillStyle = "#00F5D4";
    ctx.fillRect(-15, -12, 30, 22);
  }

  ctx.restore();
}
