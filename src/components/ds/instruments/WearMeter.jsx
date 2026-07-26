import { LcdReadout } from "./LcdReadout";

// Engine / Tires / Brakes / Trans condition. Thresholds match career.js:
// above 50 is teal, above 25 is orange, below is red. Hidden channels read
// ??? — you didn't install the gauge.
export function WearMeter({ label, value, visible = true, height = 5 }) {
  const tone = value > 50 ? "teal" : value > 25 ? "orange" : "red";
  return (
    <div style={{ flex: 1, minWidth: 56, fontFamily: "var(--gl-font-mono)" }}>
      <div style={{ fontSize: "var(--gl-size-micro)", fontWeight: 700, letterSpacing: 1, color: "var(--gl-text-3)" }}>{label}</div>
      {visible ? (
        <>
          <div style={{ height, background: "var(--gl-panel-sunk)", border: "1px solid var(--gl-border)", borderRadius: "var(--gl-radius-chip)", marginTop: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, value))}%`, background: `var(--gl-${tone})`, boxShadow: `0 0 6px rgba(var(--gl-${tone}-rgb),0.6)` }} />
          </div>
          <div style={{ marginTop: 3 }}><LcdReadout value={Math.round(value)} suffix="%" tone={tone} size="sm" /></div>
        </>
      ) : (
        <div style={{ fontSize: "var(--gl-size-label)", color: "var(--gl-text-off)", marginTop: 4 }}>???</div>
      )}
    </div>
  );
}
