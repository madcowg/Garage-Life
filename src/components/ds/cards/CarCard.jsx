import { CarThumb } from "./CarThumb";

// Vehicle card — same frame language as GameCard (2px border-by-tone, 6px
// radius, panel gradient fill, glow-on-selected) since this is a card game:
// every car shown anywhere (car select, garage, dealership) should read as
// the same species of card as the race-action cards, not a separate list-
// item style. Art fills the top like a trading card; stats/blurb sit below.
export function CarCard({ carId, variant, name, stats, desc, tone = "pink", selected = false, locked = false, lockNote, marker = false, onClick, footer }) {
  const line = locked ? "var(--gl-border)" : selected ? `var(--gl-${tone})` : "var(--gl-border)";
  const clickable = !locked && !!onClick;
  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        width: 168, flexShrink: 0, textAlign: "left", position: "relative",
        background: "linear-gradient(180deg, var(--gl-panel) 0%, var(--gl-panel-sunk) 100%)",
        border: `var(--gl-border-card) ${locked ? "dashed" : "solid"} ${line}`, borderRadius: "var(--gl-radius-card)",
        padding: 8, color: "var(--gl-text-1)", fontFamily: "var(--gl-font-mono)",
        cursor: locked ? "not-allowed" : clickable ? "pointer" : "default",
        opacity: locked ? 0.55 : 1,
        boxShadow: selected ? `0 0 16px rgba(var(--gl-${tone}-rgb),0.6)` : `0 0 6px rgba(var(--gl-${tone}-rgb),0.2)`,
      }}
    >
      {marker && (
        <div style={{ position: "absolute", top: 14, right: 14, fontSize: 11, fontWeight: 700, color: selected ? `var(--gl-${tone})` : "var(--gl-text-off)" }}>
          {selected ? "✓" : "·"}
        </div>
      )}
      <CarThumb carId={carId} variant={variant} />
      <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700, marginTop: 6, lineHeight: 1.25, minHeight: 26 }}>{name}</div>
      {stats && <div style={{ fontSize: 9, color: `var(--gl-${tone})`, fontWeight: 700, letterSpacing: 0.5, marginTop: 2, lineHeight: 1.4 }}>{stats}</div>}
      {desc && <div style={{ fontSize: 9, color: "var(--gl-text-3)", lineHeight: 1.4, marginTop: 4, minHeight: 26 }}>{desc}</div>}
      {locked && lockNote && <div style={{ fontSize: 9, color: "var(--gl-text-dead)", marginTop: 4 }}>locked — {lockNote}</div>}
      {footer && <div style={{ marginTop: 6 }}>{footer}</div>}
    </div>
  );
}
