import { C } from "../theme";
import { Shell } from "./shared";

// Generic result screen for Work/Job-Hunt/Maintain actions — each is a
// single instant resolution rather than a whole sub-flow like Race, so they
// share this one "here's what happened, continue" screen instead of each
// needing a bespoke one.
export default function ActionResultScreen({ title, icon, color, message, detail, cashDelta, onContinue }) {
  return (
    <Shell maxWidth={480}>
        <div style={{ background: C.panel, border: `2px solid ${color || C.teal}`, borderRadius: 6, padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 32 }}>{icon}</div>
          <div style={{ fontSize: 16, fontWeight: "bold", color: color || C.teal, letterSpacing: 1, marginTop: 8 }}>{title}</div>
          <div style={{ fontSize: 11, color: "#ccc", marginTop: 10 }}>{message}</div>
          {detail && <div style={{ fontSize: 9, color: "#777", marginTop: 8 }}>{detail}</div>}
          {cashDelta != null && (
            <div style={{ fontSize: 18, fontWeight: "bold", marginTop: 12, color: cashDelta >= 0 ? C.gold : C.red }}>
              {cashDelta >= 0 ? "+" : ""}${cashDelta}
            </div>
          )}
        </div>
        <button
          onClick={onContinue}
          style={{ width: "100%", padding: 12, marginTop: 16, background: C.pink, color: C.purple, border: "none", borderRadius: 4, fontFamily: "monospace", fontWeight: "bold", cursor: "pointer", letterSpacing: 1 }}
        >
          CONTINUE →
        </button>
    </Shell>
  );
}
