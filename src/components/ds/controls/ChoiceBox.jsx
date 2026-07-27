import { useState } from "react";

// A pick-one tile. Border color is the status light — selection fills with a
// 12% mix of the tile's own accent, never an arbitrary hex. 3px edge.
export function ChoiceBox({ title, desc, meta, tone = "teal", selected = false, locked = false, lockNote, marker = false, onClick, children }) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const line = locked ? "var(--gl-border)" : selected ? `var(--gl-${tone})` : "var(--gl-border)";
  const e = locked ? 2 : pressed ? 0 : 3;
  return (
    <div
      onClick={locked ? undefined : onClick}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPressed(false); }}
      style={{
        flex: "1 1 180px", minWidth: 160, padding: 10, borderRadius: "var(--gl-radius-panel)",
        border: `1px ${locked ? "dashed" : "solid"} ${line}`,
        backgroundImage: "var(--gl-face-texture), linear-gradient(180deg, #1B1A3C 0%, var(--gl-panel) 48%, #0E0D24 100%)",
        backgroundColor: selected ? `var(--gl-${tone}-fill)` : "transparent",
        boxShadow: [`0 ${e}px 0 #0A0918`, "var(--gl-inset-highlight)", locked ? null : `0 0 10px rgba(var(--gl-${tone}-rgb),${selected || hover ? 0.4 : 0.14})`].filter(Boolean).join(", "),
        transform: pressed ? "translateY(var(--gl-press-travel))" : "none",
        opacity: locked ? 0.55 : 1, cursor: locked ? "not-allowed" : "pointer",
        fontFamily: "var(--gl-font-mono)", color: "var(--gl-text-1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {marker && <span style={{ fontSize: 9, color: selected ? `var(--gl-${tone})` : "var(--gl-text-off)" }}>{selected ? "✓" : "·"}</span>}
        <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700 }}>{title}</div>
      </div>
      {desc && <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", minHeight: 26, marginTop: 3, lineHeight: 1.45, fontFamily: "var(--gl-font-body)" }}>{desc}</div>}
      {locked && lockNote && <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-dead)", marginTop: 4 }}>locked — {lockNote}</div>}
      {meta && <div style={{ fontSize: "var(--gl-size-micro)", fontWeight: 700, color: `var(--gl-${tone})`, marginTop: 6, letterSpacing: 1 }}>{meta}</div>}
      {children && <div style={{ marginTop: 6 }}>{children}</div>}
    </div>
  );
}
