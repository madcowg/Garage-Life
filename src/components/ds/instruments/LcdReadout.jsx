// Seven-segment numerals. DSEG7 contains only 0-9 - . : — so $, +, % and
// units sit beside the display in Plex Mono at 60% of the numeral size.
const SIZES = { sm: "var(--gl-lcd-sm)", md: "var(--gl-lcd-md)", lg: "var(--gl-lcd-lg)" };

export function LcdReadout({ value, prefix, suffix, tone = "teal", size = "md", label, align = "left" }) {
  const px = SIZES[size] ?? SIZES.md;
  const affix = { fontFamily: "var(--gl-font-mono)", fontSize: `calc(${px} * var(--gl-lcd-unit-scale))`, fontWeight: 600, opacity: 0.85 };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "right" ? "flex-end" : "flex-start", gap: 2 }}>
      {label && <div style={{ fontFamily: "var(--gl-font-mono)", fontSize: "var(--gl-size-micro)", fontWeight: 700, letterSpacing: "var(--gl-track-label)", color: "var(--gl-text-3)" }}>{label}</div>}
      <div style={{ display: "flex", alignItems: "baseline", gap: 2, color: `var(--gl-${tone})` }}>
        {prefix && <span style={affix}>{prefix}</span>}
        <span style={{ fontFamily: "var(--gl-font-lcd)", fontStyle: "italic", fontSize: px, lineHeight: 1, textShadow: `0 0 7px rgba(var(--gl-${tone}-rgb),0.75)` }}>{value}</span>
        {suffix && <span style={affix}>{suffix}</span>}
      </div>
    </div>
  );
}
