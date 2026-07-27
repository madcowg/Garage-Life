import { useState } from "react";

// Secondary screen-header nav — CareerHome's ROLODEX / ACHIEVEMENTS pair,
// per the "Design Language" doc's SCREEN HEADER spec. Distinct from every
// other button chassis: a rounded-bottom index card with two tab-index dash
// marks up top and a finger-pull notch punched out of the bottom edge, so it
// reads as a physical rolodex card rather than a generic pill button.
// Outline-on-panel only — this is secondary nav, never "advances the game".
export function RolodexNavButton({ tone = "pink", label, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative", overflow: "hidden", cursor: "pointer",
        padding: "7px 14px 11px",
        background: "linear-gradient(180deg, #2A1440 0%, #1B0F2E 100%)",
        color: `var(--gl-${tone})`,
        border: `1px solid var(--gl-${tone})`,
        borderRadius: "var(--gl-radius-tab)",
        fontFamily: "var(--gl-font-display)",
        fontSize: 10, letterSpacing: "1.5px",
        boxShadow: `0 3px 0 var(--gl-${tone}-shadow), inset 0 1px 0 rgba(var(--gl-${tone}-rgb),0.28)${hover ? `, 0 0 10px rgba(var(--gl-${tone}-rgb),0.5)` : ""}`,
        textShadow: `0 0 8px rgba(var(--gl-${tone}-rgb),0.45)`,
        display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4,
      }}
    >
      <span style={{ position: "relative", display: "flex", gap: 3 }}>
        <span style={{ width: 14, height: 2, background: `var(--gl-${tone})`, opacity: 0.55 }} />
        <span style={{ width: 14, height: 2, background: `var(--gl-${tone})`, opacity: 0.3 }} />
      </span>
      <span style={{ position: "relative" }}>{label}</span>
      <span style={{
        position: "absolute", left: "50%", bottom: 0, width: 18, height: 7, marginLeft: -9,
        background: "var(--gl-bg)", borderRadius: "9px 9px 0 0", borderTop: `1px solid var(--gl-${tone})`,
      }} />
      <span style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(to bottom, rgba(0,0,0,0.16) 0 1px, rgba(0,0,0,0) 1px 3px)",
      }} />
    </button>
  );
}
