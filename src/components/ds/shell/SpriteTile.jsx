// Integer scale only, always pixelated. Fractional scaling merges source
// pixels into uneven blocks, which is the one thing the 16-bit look cannot
// survive. 96x64 front/rear, 112x64 three-quarter views; tires on y=56.
// No consumer yet (RoadView draws cars to canvas, not as an <img>) — added
// for the future garage/car-select screen.
const VIEWS = { front: [96, 64], rear: [96, 64], q34l: [112, 64], q34r: [112, 64] };

export function SpriteTile({ src, alt = "", view = "front", scale = 2, shadow = true, framed = true }) {
  const [w, h] = VIEWS[view] ?? VIEWS.front;
  const flip = view === "q34r";
  return (
    <div style={{
      width: w * scale, height: h * scale, position: "relative",
      background: framed ? "var(--gl-panel-sunk)" : "transparent",
      border: framed ? "1px solid var(--gl-border)" : "none",
      borderRadius: framed ? "var(--gl-radius-plate)" : 0,
      display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden",
    }}>
      {shadow && (
        <div style={{ position: "absolute", left: "50%", bottom: (h - 56) * scale, transform: "translateX(-50%)", width: w * scale * 0.62, height: 3 * scale, borderRadius: "50%", background: "rgba(0,0,0,0.45)", boxShadow: `0 0 0 ${scale}px rgba(0,0,0,0.22)` }} />
      )}
      <img src={src} alt={alt} draggable={false} style={{ width: w * scale, height: h * scale, imageRendering: "pixelated", transform: flip ? "scaleX(-1)" : "none", position: "relative" }} />
    </div>
  );
}
