import { useState } from "react";

// Header nav that isn't a filled button, because filled means "this advances
// the game". Rolodex-card tab silhouette.
export function RolodexTab({ label, tone = "violet", active = false, onClick }) {
  const [hover, setHover] = useState(false);
  const glow = active ? 0.5 : hover ? 0.35 : 0.12;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        padding: "7px 13px 9px", borderRadius: "var(--gl-radius-tab)",
        border: `1px solid ${active ? `var(--gl-${tone})` : "var(--gl-border)"}`,
        borderTopWidth: 2,
        backgroundImage: "var(--gl-face-texture), linear-gradient(180deg, #1B1A3C 0%, var(--gl-panel) 48%, #0E0D24 100%)",
        backgroundColor: active ? `var(--gl-${tone}-fill)` : "transparent",
        boxShadow: `0 3px 0 #0A0918, var(--gl-inset-highlight), 0 0 10px rgba(var(--gl-${tone}-rgb),${glow})`,
        color: active ? `var(--gl-${tone})` : "var(--gl-text-3)",
        fontFamily: "var(--gl-font-mono)", fontSize: "var(--gl-size-micro)", fontWeight: 700,
        letterSpacing: "var(--gl-track-label)", textTransform: "uppercase", cursor: "pointer",
      }}
    >{label}</button>
  );
}
