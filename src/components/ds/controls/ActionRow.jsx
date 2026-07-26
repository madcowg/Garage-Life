import { useState } from "react";
import { outlinedFace } from "./Button";

// A monthly action: verb on the left, cost line beside it. Cost is always
// visible and always in the same order — AP first, cash second, outcome third.
export function ActionRow({ label, cost, tone = "pink", disabled = false, reason, onClick }) {
  const [pressed, setPressed] = useState(false);
  const [hover, setHover] = useState(false);
  const face = outlinedFace({ tone, pressed, disabled, glow: hover && !disabled ? 0.55 : 0.28 });
  return (
    <button
      onClick={disabled ? undefined : onClick} disabled={disabled}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPressed(false); }}
      style={{
        ...face, width: "100%", textAlign: "left", padding: "13px 14px",
        borderRadius: "var(--gl-radius-panel)", cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--gl-font-mono)", color: "var(--gl-text-1)", opacity: disabled ? 0.6 : 1,
        display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap",
      }}
    >
      <span style={{ fontWeight: 700, fontSize: "var(--gl-size-heading)", letterSpacing: "var(--gl-track-label)", textTransform: "uppercase", color: disabled ? "var(--gl-text-dead)" : `var(--gl-${tone})` }}>{label}</span>
      <span style={{ fontSize: "var(--gl-size-micro)", color: disabled ? "var(--gl-text-off)" : "var(--gl-text-3)", lineHeight: 1.4 }}>
        {disabled ? (reason ?? cost) : cost}
      </span>
    </button>
  );
}
