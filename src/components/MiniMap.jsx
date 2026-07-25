import { useRef, useEffect } from "react";
import { drawTrack } from "../game/track";
import { SCANLINE_OVERLAY, scanlinesEnabled } from "../theme";

// 96×72 rendered the whole course as an unreadable ~20px blob — a course
// map needs real estate. 192×144 keeps the chunky pixel look (still scaled
// up 2x+ via CSS) while giving the layout room to actually read as a course.
const W = 192, H = 144;

export default function MiniMap({ track, activeSegIndex, carT }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    drawTrack(ctx, track, {
      // Cones on now — a real autocross course map is defined by its cones,
      // not a paved line; showing them (as small dots, see track.js) is what
      // makes this read as a course instead of a stray squiggle.
      width: W, height: H, showCones: true, activeSegIndex, carT,
      palette: {
        bg: "#0a0a14", track: "#242440", active: "#FF6EC7", done: "#00594F",
        cone: "#FF6B35", gateCone: "#FFD700", apexCone: "#FF2D55",
        car: "#00F5D4", carOutline: "#0a0a14",
      },
    });
  }, [track, activeSegIndex, carT]);

  return (
    <div style={{ position: "relative", border: "1px solid #2A2A44", borderRadius: 3, overflow: "hidden", background: "#0a0a14" }}>
      <div style={{ fontSize: 7, color: "#00F5D4", letterSpacing: 1, padding: "2px 4px", background: "#0a0a14" }}>MAP</div>
      <canvas ref={canvasRef} width={W} height={H} style={{ width: "100%", height: "auto", display: "block", imageRendering: "pixelated" }} />
      {scanlinesEnabled() && <div style={SCANLINE_OVERLAY} />}
    </div>
  );
}
