// Vaporwave card frames by type — 2px border, 6px radius, the only place a
// 2px border is used. Highlight lifts the card 8px; nothing else moves.
const TYPE = {
  technique:  { tone: "teal",   label: "TECHNIQUE" },
  aggression: { tone: "pink",   label: "AGGRESSION" },
  utility:    { tone: "gold",   label: "UTILITY" },
  hazard:     { tone: "red",    label: "HAZARD" },
  strain:     { tone: "violet", label: "UNSETTLED" },
};

export function GameCard({ name, type = "technique", text, timeDelta, wear, tags, matchesSegment, highlight, disabled, small, onClick }) {
  const t = TYPE[type] ?? TYPE.technique;
  const w = small ? 88 : 108, h = small ? 124 : 152;
  const playable = !disabled && onClick;
  return (
    <button
      onClick={playable ? onClick : undefined} disabled={!playable}
      style={{
        width: w, height: h, flexShrink: 0, textAlign: "left", position: "relative",
        background: "linear-gradient(180deg, var(--gl-panel) 0%, var(--gl-panel-sunk) 100%)",
        border: `var(--gl-border-card) solid var(--gl-${t.tone})`, borderRadius: "var(--gl-radius-card)",
        padding: 6, color: "var(--gl-text-1)", fontFamily: "var(--gl-font-mono)",
        cursor: playable ? "pointer" : "default", opacity: disabled ? 0.45 : 1,
        boxShadow: highlight ? `0 0 16px rgba(var(--gl-${t.tone}-rgb),0.8)` : `0 0 6px rgba(var(--gl-${t.tone}-rgb),0.25)`,
        transform: highlight ? "translateY(-8px)" : "none",
      }}
    >
      <div style={{ fontSize: 9, letterSpacing: 1, fontWeight: 700, color: `var(--gl-${t.tone})` }}>{t.label}</div>
      <div style={{ fontSize: small ? 9 : 10, fontWeight: 700, lineHeight: 1.2, marginTop: 3, minHeight: small ? 22 : 26 }}>{name}</div>
      {tags && <div style={{ fontSize: 9, color: "var(--gl-text-3)", letterSpacing: 1 }}>{tags}</div>}
      {matchesSegment && <div style={{ fontSize: 9, fontWeight: 700, color: "var(--gl-green)" }}>✓ on line</div>}
      {timeDelta != null && timeDelta !== 0 && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 1, marginTop: 3, color: timeDelta < 0 ? "var(--gl-green)" : "var(--gl-orange)" }}>
          <span style={{ fontSize: 9, fontWeight: 600 }}>{timeDelta > 0 ? "+" : "-"}</span>
          <span style={{ fontFamily: "var(--gl-font-lcd)", fontStyle: "italic", fontSize: small ? 13 : 16, lineHeight: 1, textShadow: "0 0 6px currentColor" }}>{Math.abs(timeDelta).toFixed(2)}</span>
          <span style={{ fontSize: 9, fontWeight: 600 }}>s</span>
        </div>
      )}
      {wear && <div style={{ fontSize: 9, color: "var(--gl-orange)", marginTop: 2 }}>{wear}</div>}
      {text && <div style={{ fontSize: 9, color: "var(--gl-text-3)", position: "absolute", bottom: 6, left: 6, right: 6, lineHeight: 1.3, maxHeight: small ? 24 : 36, overflow: "hidden" }}>{text}</div>}
    </button>
  );
}
