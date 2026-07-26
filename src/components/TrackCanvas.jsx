import { useRef, useEffect } from "react";
import { drawTrack } from "../game/track";
import { SCANLINE_OVERLAY, scanlinesEnabled } from "../theme";

// Renders at a small internal resolution then scales up via CSS with
// image-rendering: pixelated — the classic SNES/Mode-7 chunky-pixel look
// (Mario Kart / F-Zero top-down map style), not a smooth vector map. Bumped
// 25% over the original 256x176 (same aspect ratio) purely for legibility —
// the winding course line and START/FINISH labels need the extra room — not
// to chase a sharper, less-chunky look. The "vibe" stays low-res because the
// line/label styling below is still bold and flat, not because the canvas
// itself is tiny.
const INTERNAL_W = 320;
const INTERNAL_H = 220;

export default function TrackCanvas({ track, activeSegIndex, carT }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    // Cones added nothing readable at this scale (just clutter, per direct
    // user feedback) — this recap map leans entirely on a bold, bright
    // course line plus labeled start/finish gates instead.
    drawTrack(ctx, track, {
      width: INTERNAL_W,
      height: INTERNAL_H,
      showCones: false,
      activeSegIndex,
      carT,
      trackWidth: 3.5,
      trackAlpha: 1,
      finishStyle: "solid",
      showGateLabels: true,
      palette: {
        bg: "#0D0D1A",
        track: "#F2F2EC",
        active: "#FF6EC7",
        done: "#00594F",
        startLine: "#00C853",
        finishLine: "#FF2D55",
        car: "#E8EAF6",
        carOutline: "#1A0533",
      },
    });
  }, [track, activeSegIndex, carT]);

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
