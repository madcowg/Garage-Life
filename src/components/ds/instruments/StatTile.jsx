import { LcdReadout } from "./LcdReadout";

// The one exception to opacity-as-material: HUD tinted glass. The active car's
// ramp at 30% -> 4% down the face, a 38% border, inset top highlight, inner
// bottom shade, one diagonal sheen, backdrop blur. Re-tints with the car (set
// data-car="<id>" on an ancestor to change --gl-car-ramp-*).
export function StatTile({ label, value, prefix, suffix, tone = "teal", note, lcd = true }) {
  return (
    <div style={{
      flex: 1, minWidth: 120, position: "relative", overflow: "hidden",
      padding: "10px 12px", borderRadius: "var(--gl-radius-panel)",
      border: "1px solid color-mix(in srgb, var(--gl-car-ramp-3) 38%, transparent)",
      background: "linear-gradient(180deg, color-mix(in srgb, var(--gl-car-ramp-2) 30%, transparent) 0%, color-mix(in srgb, var(--gl-car-ramp-2) 4%, transparent) 100%)",
      backdropFilter: "var(--gl-glass-blur)", WebkitBackdropFilter: "var(--gl-glass-blur)",
      boxShadow: "var(--gl-inset-highlight), var(--gl-inset-shade)",
      fontFamily: "var(--gl-font-mono)",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 42%)" }} />
      <div style={{ position: "relative" }}>
        {lcd ? (
          <LcdReadout label={label} value={value} prefix={prefix} suffix={suffix} tone={tone} size="md" />
        ) : (
          <>
            <div style={{ fontSize: "var(--gl-size-micro)", fontWeight: 700, letterSpacing: "var(--gl-track-label)", color: "var(--gl-text-3)" }}>{label}</div>
            <div style={{ fontSize: "var(--gl-size-heading)", fontWeight: 700, color: `var(--gl-${tone})`, marginTop: 4 }}>{value}</div>
          </>
        )}
        {note && <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", marginTop: 4 }}>{note}</div>}
      </div>
    </div>
  );
}
