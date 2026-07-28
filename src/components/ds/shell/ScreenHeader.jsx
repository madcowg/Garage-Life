import { CashPill } from "../../shared";

// Screen title in the pixel face, status line beneath it in Plex Mono, cash
// pill + nav on the right. Press Start 2P is headings only — never more than
// four words. `cash` is optional — screens with no active career (title-
// screen Collections browsing, a brand-new career) simply omit it.
export function ScreenHeader({ title, status, tone = "pink", nav, cash }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
      <div>
        <div style={{ fontFamily: "var(--gl-font-display)", fontSize: "var(--gl-size-title)", letterSpacing: "var(--gl-track-display)", lineHeight: 1.4, textTransform: "uppercase", color: `var(--gl-${tone})`, textShadow: `0 0 12px rgba(var(--gl-${tone}-rgb),0.45)` }}>{title}</div>
        {status && <div style={{ fontFamily: "var(--gl-font-mono)", fontSize: "var(--gl-size-small)", fontWeight: 600, letterSpacing: "var(--gl-track-label)", textTransform: "uppercase", color: "var(--gl-teal)", marginTop: 7 }}>{status}</div>}
      </div>
      {(cash != null || nav) && (
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          {cash != null && <CashPill cash={cash} />}
          {nav}
        </div>
      )}
    </div>
  );
}
