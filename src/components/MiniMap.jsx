import { useRef, useEffect } from "react";
import { drawTrack } from "../game/track";

const W = 96, H = 72;

export default function MiniMap({ track, activeSegIndex, carT }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    drawTrack(ctx, track, {
      width: W, height: H, showCones: false, activeSegIndex, carT,
      palette: { bg: "#0a0a14", track: "#242440", active: "#FF6EC7", done: "#00594F", car: "#00F5D4", carOutline: "#0a0a14" },
    });
  }, [track, activeSegIndex, carT]);

  return (
    <div style={{ border: "1px solid #2A2A44", borderRadius: 3, overflow: "hidden", background: "#0a0a14" }}>
      <div style={{ fontSize: 7, color: "#00F5D4", letterSpacing: 1, padding: "2px 4px", background: "#0a0a14" }}>MAP</div>
      <canvas ref={canvasRef} width={W} height={H} style={{ width: "100%", height: "auto", display: "block", imageRendering: "pixelated" }} />
    </div>
  );
}
