// Draw pile — the wordmark on a card back, with the remaining count.
// logoSrc has no default here (unlike the design-system original) — callers
// pass the project's actual asset path (BASE_URL-prefixed).
export function DeckPile({ count, logoSrc, alt = "My Garage Life", label = "draw" }) {
  return (
    <div style={{
      width: 64, height: 90, flexShrink: 0, borderRadius: "var(--gl-radius-card)",
      border: "var(--gl-border-card) solid var(--gl-pink)", background: "var(--gl-panel)",
      boxShadow: "0 0 8px rgba(var(--gl-pink-rgb),0.3)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
    }}>
      <img src={logoSrc} alt={alt} draggable={false} style={{ width: 52, imageRendering: "pixelated" }} />
      <div style={{ display: "flex", alignItems: "baseline", gap: 2, color: "var(--gl-teal)" }}>
        <span style={{ fontFamily: "var(--gl-font-mono)", fontSize: 9 }}>{label} x</span>
        <span style={{ fontFamily: "var(--gl-font-lcd)", fontStyle: "italic", fontSize: 13, textShadow: "0 0 6px currentColor" }}>{count}</span>
      </div>
    </div>
  );
}
