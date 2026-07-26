import { Shell } from "./shared";
import { Button } from "./ds/controls/Button";

// Generic result screen for Work/Job-Hunt/Maintain actions — each is a
// single instant resolution rather than a whole sub-flow like Race, so they
// share this one "here's what happened, continue" screen instead of each
// needing a bespoke one.
export default function ActionResultScreen({ title, tone = "teal", message, detail, cashDelta, onContinue }) {
  return (
    <Shell>
        <div style={{ background: "var(--gl-panel)", border: `2px solid var(--gl-${tone})`, borderRadius: "var(--gl-radius-panel)", padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: "var(--gl-size-title)", fontFamily: "var(--gl-font-display)", fontWeight: 700, color: `var(--gl-${tone})`, letterSpacing: 1, marginTop: 4, textTransform: "uppercase" }}>{title}</div>
          <div style={{ fontSize: "var(--gl-size-label)", color: "var(--gl-text-3)", marginTop: 14 }}>{message}</div>
          {detail && <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-dead)", marginTop: 8 }}>{detail}</div>}
          {cashDelta != null && (
            <div style={{ fontSize: "var(--gl-size-heading)", fontWeight: 700, marginTop: 12, color: cashDelta >= 0 ? "var(--gl-gold)" : "var(--gl-red)" }}>
              {cashDelta >= 0 ? "+" : ""}${cashDelta}
            </div>
          )}
        </div>
        <div style={{ marginTop: 16 }}>
          <Button tone="pink" size="lg" block onClick={onContinue}>Continue</Button>
        </div>
    </Shell>
  );
}
