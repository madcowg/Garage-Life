import { useMemo, useState } from "react";
import RoadView from "./RoadView";
import HUD from "./HUD";
import CardHand from "./CardHand";
import { AutocrossEvent, getCard, toCareerWear } from "../game/v2";
import { buildTrack } from "../game/track";
import { saveCourseToLog } from "./CourseLog";
import { C } from "../theme";

// Display metadata for card-core-v2 course elements.
const ELEMENT_DISPLAY = {
  start:               { icon: "🚦", color: C.pink,   desc: "Standing start. Get the power down." },
  slalom:              { icon: "🔀", color: C.gold,   desc: "Cone gates. Rhythm and transitions." },
  offsets:             { icon: "↔️", color: C.teal,   desc: "Offset gates. Connect them in a straight line." },
  sweeper:             { icon: "↩️", color: C.orange, desc: "Long arc. Sustained grip and power." },
  turnaround:          { icon: "🔄", color: "#7B2FBE", desc: "Tight 180°. Slow in, rotate, drive out." },
  "chicago-box":       { icon: "🧩", color: C.red,    desc: "Enter, cross, and exit the box precisely." },
  "decreasing-radius": { icon: "🌀", color: C.orange, desc: "Tightens as it goes. Patience on entry." },
  finish:              { icon: "🏁", color: C.white,  desc: "Finish gate. Drive through, stay precise." },
};

function RunBanner({ snap }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#888", marginBottom: 6 }}>
      <span>RUN {snap.runIndex + 1}/{snap.totalRuns} · SEGMENT {Math.min(snap.segmentIndex + 1, snap.course.length)}/{snap.course.length}</span>
      <span>FLOW {snap.flow > 0 ? "🔥" : "—"} · CONES {snap.cones}</span>
    </div>
  );
}

export default function CardRaceScreen({ loadout, careerWear, month, onFinish }) {
  const event = useMemo(() => new AutocrossEvent(loadout, careerWear), [loadout, careerWear]);
  const [, setTick] = useState(0);
  const rerender = () => setTick(t => t + 1);
  const snap = event.snapshot();

  const track = useMemo(() => buildTrack(snap.course.map(s => s.id), Math.random()), [snap.course]);

  const act = (fn) => { fn(); rerender(); };
  const disp = snap.segment ? (ELEMENT_DISPLAY[snap.segment.id] ?? { icon: "🏁", color: C.white, desc: "" }) : null;

  const finishEvent = () => {
    const summary = event.summary();
    saveCourseToLog({ track, car: loadout.car, time: summary.bestTime ?? 0, target: summary.targetTime, won: summary.won, at: Date.now() });
    onFinish({ ...summary, wearAfter: toCareerWear(summary.wearAfter), loadout, track });
  };

  const theme = month % 3 === 0 ? "palm" : "default";
  const carT = snap.phase === "segmentDone" ? 0.9 : 0.2;
  const activeSeg = Math.min(snap.segmentIndex ?? 0, snap.course.length - 1);

  return (
    <div style={{ minHeight: "100%", background: C.bg, color: C.white, fontFamily: "monospace", padding: 20 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {snap.phase !== "betweenRuns" && snap.phase !== "eventDone" && (
          <>
            <RunBanner snap={snap} />
            <RoadView track={track} activeSegIndex={activeSeg} carT={carT} carId={loadout.car} variant={loadout.variant} theme={theme} />
            <div style={{ height: 8 }} />
            <HUD
              loadout={{ ...loadout, gauges: { oilGauge: loadout.diagnostics, coolantGauge: false, boostGauge: false, transGauge: loadout.diagnostics } }}
              wear={toCareerWear(snap.wear)} totalTime={snap.totalTime} target={snap.targetTime}
              track={track} activeSegIndex={activeSeg} carT={carT}
            />
          </>
        )}

        {snap.phase === "chooseCards" && snap.segment && (
          <>
            <div style={{ background: C.panel, border: `2px solid ${disp.color}`, borderRadius: 6, padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: "bold", color: disp.color }}>{disp.icon} {snap.segment.name.toUpperCase()} <span style={{ fontSize: 9, color: "#888" }}>par {snap.segment.par.toFixed(1)}s · precision {snap.segment.precision}</span></div>
              <div style={{ fontSize: 10, color: "#aaa" }}>{disp.desc}</div>
              <div style={{ fontSize: 9, color: C.teal, marginTop: 4 }}>wants: {snap.segment.tags.join(" · ")}</div>
              {snap.hazard?.fired && (
                <div style={{ fontSize: 10, color: snap.hazard.negated ? C.gold : C.red, marginTop: 6 }}>
                  ⚠ {getCard(snap.hazard.cardId).name} {snap.hazard.negated ? "— negated by your course walk" : `fired: +${snap.hazard.timePenalty.toFixed(1)}s`}
                </div>
              )}
              {snap.strainPenalty > 0 && <div style={{ fontSize: 10, color: C.orange, marginTop: 2 }}>Unsettled car: +{snap.strainPenalty.toFixed(1)}s this segment</div>}
              {snap.utilityResult?.played && <div style={{ fontSize: 10, color: C.gold, marginTop: 2 }}>{snap.utilityResult.removedStrain ? "Strain discarded — composure restored." : `${getCard(snap.utilityResult.cardId).name} played.`}</div>}
            </div>
            <div style={{ fontSize: 9, color: C.teal, letterSpacing: 2 }}>PLAY YOUR LINE {snap.utilityPlayed ? "" : "(optional: one utility first)"}</div>
            <CardHand
              hand={snap.hand} segment={snap.segment}
              utilityPlayed={snap.utilityPlayed}
              drawCount={event.state?.drawPile.length ?? 0}
              onPlayLine={(id) => act(() => event.playLine(id))}
              onPlayUtility={(id) => act(() => event.playUtility(id))}
            />
            <button onClick={() => act(() => event.playLine(null))} style={{ marginTop: 6, padding: "8px 12px", background: C.panel, color: "#999", border: `1px solid ${C.border}`, borderRadius: 4, cursor: "pointer", fontFamily: "monospace", fontSize: 9 }}>
              SAFE LINE (fallback, +0.6s)
            </button>
          </>
        )}

        {snap.phase === "segmentDone" && snap.lastRecord && (
          <div style={{ marginTop: 8 }}>
            <div style={{ background: C.panel2, border: `1px solid ${snap.lastRecord.onAffinity ? C.green : C.orange}`, borderRadius: 6, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: "bold" }}>{getCard(snap.lastRecord.lineCardId).name} — {snap.lastRecord.onAffinity ? "ON LINE" : "OFF LINE (½ effect)"}</div>
              <div style={{ fontSize: 18, fontWeight: "bold", marginTop: 4 }}>{snap.lastRecord.segmentTime.toFixed(2)}s <span style={{ fontSize: 10, color: "#888" }}>(par {snap.segment?.par.toFixed(1) ?? "—"}s)</span></div>
              {snap.lastRecord.coneCount > 0 && <div style={{ fontSize: 10, color: C.red }}>🔺 {snap.lastRecord.coneCount} cone{snap.lastRecord.coneCount > 1 ? "s" : ""} (+{(snap.lastRecord.coneCount * 2).toFixed(0)}s)</div>}
              {snap.lastRecord.flowAfter > 0 && <div style={{ fontSize: 10, color: C.teal }}>🔥 Flow — next segment −0.3s</div>}
            </div>
            <button onClick={() => act(() => event.nextSegment())} style={{ width: "100%", padding: 12, marginTop: 8, background: C.pink, color: C.purple, border: "none", borderRadius: 4, fontWeight: "bold", cursor: "pointer", fontFamily: "monospace" }}>
              NEXT →
            </button>
          </div>
        )}

        {snap.phase === "betweenRuns" && (
          <div style={{ textAlign: "center", paddingTop: 30 }}>
            <div style={{ fontSize: 16, fontWeight: "bold", color: C.pink, letterSpacing: 2 }}>
              {snap.runIndex < 0 ? "GRID UP" : `RUN ${snap.runIndex + 1} COMPLETE`}
            </div>
            {snap.runIndex >= 0 && snap.results.length > 0 && (
              <div style={{ margin: "14px 0" }}>
                {snap.results.map((r, i) => (
                  <div key={i} style={{ fontSize: 11, color: r.dnf ? C.red : C.white }}>
                    Run {i + 1}: {r.dnf ? "DNF" : `${r.time.toFixed(2)}s${r.cones ? ` (${r.cones} 🔺)` : ""}`}
                  </div>
                ))}
                <div style={{ fontSize: 11, color: C.gold, marginTop: 6 }}>Best: {event.bestRun() ? event.bestRun().time.toFixed(2) + "s" : "—"} / Target {snap.targetTime.toFixed(2)}s</div>
              </div>
            )}
            {snap.runIndex < 0 && snap.hazardPreview.total > 0 && (
              <div style={{ fontSize: 10, color: C.orange, margin: "10px 0" }}>
                ⚠ Tech inspection: {snap.hazardPreview.total} hazard card{snap.hazardPreview.total > 1 ? "s" : ""} in your deck
                {snap.hazardPreview.unknown > 0 ? ` (${snap.hazardPreview.unknown} unknown — no diagnostics)` : ""}
              </div>
            )}
            <button onClick={() => act(() => event.startRun())} style={{ padding: "12px 28px", background: C.pink, color: C.purple, border: "none", borderRadius: 4, fontWeight: "bold", cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }}>
              {snap.runIndex < 0 ? "FIRST RUN →" : `RUN ${snap.runIndex + 2} →`}
            </button>
            {snap.runIndex >= 0 && event.bestRun() && (
              <div>
                <button onClick={() => act(() => { event.endEventEarly(); })} style={{ marginTop: 10, padding: "8px 16px", background: C.panel, color: "#999", border: `1px solid ${C.border}`, borderRadius: 4, cursor: "pointer", fontFamily: "monospace", fontSize: 9 }}>
                  BANK BEST TIME, SKIP REMAINING RUNS
                </button>
              </div>
            )}
          </div>
        )}

        {snap.phase === "eventDone" && (
          <div style={{ textAlign: "center", paddingTop: 30 }}>
            <div style={{ fontSize: 18, fontWeight: "bold", color: event.summary().won ? C.gold : C.orange, letterSpacing: 2 }}>
              {event.summary().won ? "🏆 TARGET BEATEN" : event.summary().bestTime == null ? "EVENT DNF" : "EVENT COMPLETE"}
            </div>
            <div style={{ fontSize: 24, fontWeight: "bold", margin: "10px 0" }}>
              {event.summary().bestTime != null ? `${event.summary().bestTime.toFixed(2)}s` : "—"}
              <span style={{ fontSize: 12, color: "#888" }}> / {snap.targetTime.toFixed(2)}s target</span>
            </div>
            <button onClick={finishEvent} style={{ padding: "12px 28px", background: C.pink, color: C.purple, border: "none", borderRadius: 4, fontWeight: "bold", cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }}>
              SEE RESULTS →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
