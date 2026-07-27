// Small glyphs for the car spec line (HP/HDL/GRIP/TRN) — blocky, single-color,
// currentColor fill/stroke so each inherits whatever tone the surrounding
// text is set to (matches the app-wide "no gradients, no photographic icons"
// convention already used by CarThumb's PlaceholderGlyph).
function HpIcon() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
      <path d="M9.5 1 4 9.2h3.3L6.4 15l6-8.4H9L9.5 1Z" fill="currentColor" />
    </svg>
  );
}

function HdlIcon() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
      <circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <line x1="8" y1="8" x2="8" y2="2.6" stroke="currentColor" strokeWidth="1.7" />
      <line x1="8" y1="8" x2="3.6" y2="10.7" stroke="currentColor" strokeWidth="1.7" />
      <line x1="8" y1="8" x2="12.4" y2="10.7" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
      <circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="8" cy="8" r="2.1" fill="currentColor" />
      <line x1="8" y1="1.4" x2="8" y2="3.2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8" y1="12.8" x2="8" y2="14.6" stroke="currentColor" strokeWidth="1.5" />
      <line x1="1.4" y1="8" x2="3.2" y2="8" stroke="currentColor" strokeWidth="1.5" />
      <line x1="12.8" y1="8" x2="14.6" y2="8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function TrnIcon() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="8" cy="8" r="3.2" />
        {[0, 60, 120, 180, 240, 300].map(deg => (
          <rect key={deg} x="7.1" y="0.6" width="1.8" height="3" transform={`rotate(${deg} 8 8)`} />
        ))}
      </g>
      <circle cx="8" cy="8" r="1.3" fill="var(--gl-panel-sunk)" />
    </svg>
  );
}

const ICONS = { hp: HpIcon, hdl: HdlIcon, grip: GripIcon, trn: TrnIcon };

export function StatIcon({ stat }) {
  const Glyph = ICONS[stat];
  return Glyph ? <Glyph /> : null;
}

// Composed HP/HDL/GRIP/TRN row for a car's spec line — one place that knows
// the icon+abbreviation+value layout, so every screen showing car stats
// (CarCard today, Codex/PreRaceSetup later) renders them identically.
export function CarStatLine({ hp, handling, grip, trans }) {
  const stats = [["hp", "HP", hp], ["hdl", "HDL", handling], ["grip", "GRIP", grip], ["trn", "TRN", trans]];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
      {stats.map(([key, label, value]) => (
        <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: 3 }} title={label}>
          <StatIcon stat={key} />{value}
        </span>
      ))}
    </div>
  );
}
