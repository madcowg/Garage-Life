import { useState } from "react";

// Every control is one molded object: vertical gradient (light top -> base ->
// 20% darker bottom), a 1px inset top highlight, a hard bottom edge in the
// accent's own shadow tone, and a 1-in-3px scanline texture baked into the
// face so it reads as plastic under the tube. No soft drop shadows.
export function moldedFace({ tone = "pink", edge = 4, pressed = false, disabled = false, glow = 0.28 }) {
  const base = `var(--gl-${tone})`, shade = `var(--gl-${tone}-shadow)`, rgb = `var(--gl-${tone}-rgb)`;
  const e = disabled ? 2 : pressed ? 0 : edge;
  return {
    backgroundImage: `var(--gl-face-texture), linear-gradient(180deg, color-mix(in srgb, white 18%, ${base}) 0%, ${base} 48%, color-mix(in srgb, black 20%, ${base}) 100%)`,
    boxShadow: [`0 ${e}px 0 ${shade}`, "var(--gl-inset-highlight)", disabled ? "none" : `0 0 12px rgba(${rgb},${glow})`].filter(s => s !== "none").join(", "),
    transform: pressed ? "translateY(var(--gl-press-travel))" : "none",
  };
}

export function outlinedFace({ tone = "teal", pressed = false, disabled = false, glow = 0.28 }) {
  const line = disabled ? "var(--gl-border)" : `var(--gl-${tone})`, rgb = `var(--gl-${tone}-rgb)`;
  return {
    backgroundImage: "var(--gl-face-texture), linear-gradient(180deg, #1B1A3C 0%, var(--gl-panel) 48%, #0E0D24 100%)",
    border: `1px solid ${line}`,
    boxShadow: [`0 ${disabled ? 2 : pressed ? 0 : 4}px 0 #0A0918`, "var(--gl-inset-highlight)", disabled ? "none" : `0 0 12px rgba(${rgb},${glow})`].filter(s => s !== "none").join(", "),
    transform: pressed ? "translateY(var(--gl-press-travel))" : "none",
  };
}

const SIZES = {
  sm: { padding: "6px 12px", fontSize: "var(--gl-size-micro)" },
  md: { padding: "9px 16px", fontSize: "var(--gl-size-label)" },
  lg: { padding: "14px 20px", fontSize: "var(--gl-size-heading)" },
};

// The primary control. Filled means "this advances the game" — reserve it for
// the one action that ends the screen. Outlined is navigation.
export function Button({ children, tone = "pink", variant = "filled", size = "md", disabled = false, block = false, reason, onClick, ...rest }) {
  const [pressed, setPressed] = useState(false);
  const [hover, setHover] = useState(false);
  const glow = hover && !disabled ? 0.55 : 0.28;
  const face = variant === "filled"
    ? moldedFace({ tone, pressed, disabled, glow })
    : outlinedFace({ tone, pressed, disabled, glow });
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false); }}
      style={{
        ...SIZES[size], ...face,
        width: block ? "100%" : undefined,
        border: variant === "filled" ? "none" : face.border,
        borderRadius: "var(--gl-radius-panel)",
        fontFamily: "var(--gl-font-mono)", fontWeight: 700,
        letterSpacing: "var(--gl-track-label)", textTransform: "uppercase",
        color: disabled ? "var(--gl-text-dead)" : variant === "filled" ? "var(--gl-ink)" : `var(--gl-${tone})`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 3,
      }}
      {...rest}
    >
      <span>{children}</span>
      {disabled && reason && (
        <span style={{ fontSize: 9, fontWeight: 400, letterSpacing: 0, textTransform: "none", color: "var(--gl-text-off)" }}>{reason}</span>
      )}
    </button>
  );
}
