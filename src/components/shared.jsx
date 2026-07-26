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

// Shared responsive screen shell — every non-title screen renders through
// this one component at the one column width (--gl-shell-max-width), so the
// app reads as a consistent size instead of each screen picking its own.
// No per-screen maxWidth override — if a screen needs to be wider or
// narrower, that's a decision for the shared token, not a one-off prop.
export function Shell({ children }) {
  const scale = useViewportScale();
  return (
    <div style={{ minHeight: "100dvh", background: "var(--gl-bg)", color: "var(--gl-text-1)", fontFamily: "var(--gl-font-mono)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "var(--gl-shell-max-width)", padding: "clamp(10px, 3vw, 24px)", zoom: scale }}>
        {children}
      </div>
    </div>
  );
}

// Always-visible cash readout — fixed to the viewport (not the zoomed Shell
// column) so it survives scrolling and stays legible at any screen scale.
// Bottom-left is the one corner no screen already anchors a nav button to.
export function CashBadge({ cash }) {
  return (
    <div style={{
      position: "fixed", left: 10, bottom: 10, zIndex: 50, pointerEvents: "none",
      background: "rgba(10,10,20,0.88)", border: `1px solid ${C.gold}`, borderRadius: 20,
      padding: "6px 14px", fontFamily: "monospace", fontSize: 12, fontWeight: "bold", color: C.gold,
      boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
    }}>
      ${cash}
    </div>
  );
}

// collapsible/defaultOpen are opt-in — every existing call site renders
// exactly as before (always open, no toggle chrome).
export function Section({ title, children, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = collapsible ? open : true;
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
        style={{
          fontSize: 9, color: C.teal, letterSpacing: 2, marginBottom: 6,
          display: "flex", alignItems: "center", gap: 6,
          cursor: collapsible ? "pointer" : "default", userSelect: collapsible ? "none" : "auto",
        }}
      >
        {collapsible && (
          <span style={{ display: "inline-block", transition: "transform 0.15s ease", transform: isOpen ? "rotate(90deg)" : "none" }}>▸</span>
        )}
        {title}
      </div>
      {isOpen && children}
    </div>
  );
}

export function ToggleRow({ label, desc, active, onClick }) {
  return (
    <button onClick={onClick} style={{ textAlign: "left", padding: 8, background: active ? "#122b28" : C.panel, border: `1px solid ${active ? C.teal : C.border}`, borderRadius: 4, cursor: "pointer", color: C.white }}>
      <div style={{ fontSize: 10, fontWeight: "bold" }}>{active ? "☑" : "☐"} {label}</div>
      <div style={{ fontSize: 8, color: "#777" }}>{desc}</div>
    </button>
  );
}
