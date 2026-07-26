// Bordered container. 1px hairline is the default and the border color is
// the status light — that is how state is signalled, not with background.
export function Panel({ title, tone, sunk = false, children, style }) {
  return (
    <div style={{
      background: sunk ? "var(--gl-panel-sunk)" : "var(--gl-panel)",
      border: `1px solid ${tone ? `var(--gl-${tone})` : "var(--gl-border)"}`,
      borderRadius: "var(--gl-radius-panel)", padding: 10,
      boxShadow: tone ? `0 0 10px rgba(var(--gl-${tone}-rgb),0.18)` : "none",
      fontFamily: "var(--gl-font-mono)", color: "var(--gl-text-1)", ...style,
    }}>
      {title && (
        <div style={{ fontSize: "var(--gl-size-micro)", fontWeight: 700, letterSpacing: "var(--gl-track-label)", textTransform: "uppercase", color: tone ? `var(--gl-${tone})` : "var(--gl-teal)", marginBottom: 8 }}>{title}</div>
      )}
      {children}
    </div>
  );
}

// A plate — the solid ground text sits on when it would otherwise land on
// pixel art. No text ever sits directly on a sprite or backdrop.
export function Plate({ children, style }) {
  return (
    <div style={{ background: "var(--gl-panel-sunk)", border: "1px solid var(--gl-border)", borderRadius: "var(--gl-radius-plate)", padding: "6px 8px", fontFamily: "var(--gl-font-mono)", fontSize: "var(--gl-size-micro)", color: "var(--gl-text-2)", lineHeight: 1.5, ...style }}>{children}</div>
  );
}
