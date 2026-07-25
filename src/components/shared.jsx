import { useEffect, useState } from "react";
import { C } from "../theme";

// Game-style viewport scaling: the UI is designed at a fixed column width,
// then zoomed up to fill the actual display — same behavior as the
// full-bleed title screen, so the game no longer reads "reduced" next to
// it on a big monitor. Width-based only (vertical scrolls normally);
// phones get scale 1.
function useViewportScale() {
  const calc = () => Math.min(Math.max(window.innerWidth / 1000, 1), 1.7);
  const [scale, setScale] = useState(calc);
  useEffect(() => {
    const onResize = () => setScale(calc());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return scale;
}

// Shared responsive screen shell — every screen sizes from the actual
// viewport: 100dvh tall (mobile browser-chrome safe), full-width column on
// phones, centered column zoomed to match the display on desktop.
export function Shell({ maxWidth = 760, children }) {
  const scale = useViewportScale();
  return (
    <div style={{ minHeight: "100dvh", background: C.bg, color: C.white, fontFamily: "monospace", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth, padding: "clamp(10px, 3vw, 24px)", zoom: scale }}>
        {children}
      </div>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, color: C.teal, letterSpacing: 2, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

export function cardBtnStyle(active) {
  return { flex: "1 1 160px", minWidth: 160, textAlign: "left", padding: 10, background: active ? "#1c1c3a" : C.panel, border: `1px solid ${active ? C.pink : C.border}`, borderRadius: 4, cursor: "pointer", color: C.white };
}

export function ToggleRow({ label, desc, active, onClick }) {
  return (
    <button onClick={onClick} style={{ textAlign: "left", padding: 8, background: active ? "#122b28" : C.panel, border: `1px solid ${active ? C.teal : C.border}`, borderRadius: 4, cursor: "pointer", color: C.white }}>
      <div style={{ fontSize: 10, fontWeight: "bold" }}>{active ? "☑" : "☐"} {label}</div>
      <div style={{ fontSize: 8, color: "#777" }}>{desc}</div>
    </button>
  );
}
