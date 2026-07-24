import { useRef, useEffect } from "react";
import { drawTrack } from "../game/track";

// Renders at a small internal resolution then scales up via CSS with
// image-rendering: pixelated — the classic SNES/Mode-7 chunky-pixel look
// (Mario Kart / F-Zero top-down map style), not a smooth vector map.
const INTERNAL_W = 256;
const INTERNAL_H = 176;

export default function TrackCanvas({ track, activeSegIndex, carT }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    drawTrack(ctx, track, {
      width: INTERNAL_W,
      height: INTERNAL_H,
      showCones: true,
      activeSegIndex,
      carT,
      palette: {
        bg: "#0D0D1A",
        track: "#2A2A44",
        active: "#FF6EC7",
        done: "#00594F",
        cone: "#FF6B35",
        gateCone: "#FFD700",
        car: "#E8EAF6",
        carOutline: "#1A0533",
      },
    });
  }, [track, activeSegIndex, carT]);

  return (
    <div style={{
      border: "3px solid #2A2A44", borderRadius: 4, overflow: "hidden",
      boxShadow: "0 0 24px rgba(255,110,199,0.15)", background: "#0D0D1A",
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
