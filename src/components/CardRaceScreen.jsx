import { useMemo, useState } from "react";
import RoadView from "./RoadView";
import HUD from "./HUD";
import CardHand from "./CardHand";
import { AutocrossEvent, getCard, toCareerWear } from "../game/v2";
import { buildTrack } from "../game/track";
import { saveCourseToLog } from "./CourseLog";
import { Shell } from "./shared";
import { Button } from "./ds/controls/Button";

// Display metadata for card-core-v2 course elements.
const ELEMENT_DISPLAY = {
  start:               { tone: "pink",   desc: "Standing start. Get the power down." },
  slalom:              { tone: "gold",   desc: "Cone gates. Rhythm and transitions." },
  offsets:             { tone: "teal",   desc: "Offset gates. Connect them in a straight line." },
  sweeper:             { tone: "orange", desc: "Long arc. Sustained grip and power." },
  turnaround:          { tone: "violet", desc: "Tight 180°. Slow in, rotate, drive out." },
  "chicago-box":       { tone: "red",    desc: "Enter, cross, and exit the box precisely." },
  "decreasing-radius": { tone: "orange", desc: "Tightens as it goes. Patience on entry." },
  finish:              { tone: "teal",   desc: "Finish gate. Drive through, stay precise." },
};

function RunBanner({ snap }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)", marginBottom: 6 }}>
      <span>RUN {snap.runIndex + 1}/{snap.totalRuns} · SEGMENT {Math.min(snap.segmentIndex + 1, snap.course.length)}/{snap.course.length}</span>
      <span>FLOW {snap.flow > 0 ? "ON" : "—"} · CONES {snap.cones}</span>
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
  const disp = snap.segment ? (ELEMENT_DISPLAY[snap.segment.id] ?? { tone: "teal", desc: "" }) : null;

  const finishEvent = () => {
    const summary = event.summary();
    saveCourseToLog({ track, car: loadout.car, time: summary.bestTime ?? 0, target: summary.targetTime, won: summary.won, at: Date.now() });
    onFinish({ ...summary, wearAfter: toCareerWear(summary.wearAfter), loadout, track });
  };

  const theme = month % 3 === 0 ? "palm" : "default";
  const carT = snap.phase === "segmentDone" ? 0.9 : 0.2;
  const activeSeg = Math.min(snap.segmentIndex ?? 0, snap.course.length - 1);

  return (
    <Shell>

        {snap.phase !== "betweenRuns" && snap.phase !== "eventDone" && (
          <>
            <RunBanner snap={snap} />
            <RoadView
              track={track} activeSegIndex={activeSeg} carT={carT} carId={loadout.car} variant={loadout.variant} theme={theme}
              totalTime={snap.totalTime} targetTime={snap.targetTime}
            />
            <div style={{ height: 8 }} />
            <HUD
              loadout={{ ...loadout, gauges: { oilGauge: loadout.diagnostics, coolantGauge: false, boostGauge: false, transGauge: loadout.diagnostics } }}
              wear={toCareerWear(snap.wear)}
            />
          </>
        )}

        {snap.phase === "chooseCards" && snap.segment && (
          <>
            <div style={{ background: "var(--gl-panel)", border: `2px solid var(--gl-${disp.tone})`, borderRadius: "var(--gl-radius-panel)", padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: "var(--gl-size-heading)", fontWeight: 700, color: `var(--gl-${disp.tone})` }}>{snap.segment.name.toUpperCase()} <span style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)" }}>par {snap.segment.par.toFixed(1)}s · precision {snap.segment.precision}</span></div>
              <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)" }}>{disp.desc}</div>
              <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-teal)", marginTop: 4 }}>wants: {snap.segment.tags.join(" · ")}</div>
              {snap.hazard?.fired && (
                <div style={{ fontSize: "var(--gl-size-micro)", color: snap.hazard.negated ? "var(--gl-gold)" : "var(--gl-red)", marginTop: 6 }}>
                  {getCard(snap.hazard.cardId).name} {snap.hazard.negated ? "— negated by your course walk" : `fired: +${snap.hazard.timePenalty.toFixed(1)}s`}
                </div>
              )}
              {snap.strainPenalty > 0 && <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-orange)", marginTop: 2 }}>Unsettled car: +{snap.strainPenalty.toFixed(1)}s this segment</div>}
              {snap.utilityResult?.played && <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-gold)", marginTop: 2 }}>{snap.utilityResult.removedStrain ? "Strain discarded — composure restored." : `${getCard(snap.utilityResult.cardId).name} played.`}</div>}
            </div>
            <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-teal)", letterSpacing: 2 }}>PLAY YOUR LINE {snap.utilityPlayed ? "" : "(optional: one utility first)"}</div>
            <CardHand
              hand={snap.hand} segment={snap.segment}
              utilityPlayed={snap.utilityPlayed}
              drawCount={event.state?.drawPile.length ?? 0}
              onPlayLine={(id) => act(() => event.playLine(id))}
              onPlayUtility={(id) => act(() => event.playUtility(id))}
            />
            <div style={{ marginTop: 6 }}>
              <Button tone="violet" variant="outlined" size="sm" onClick={() => act(() => event.playLine(null))}>Safe line (fallback, +0.6s)</Button>
            </div>
          </>
        )}

        {snap.phase === "segmentDone" && snap.lastRecord && (
          <div style={{ marginTop: 8 }}>
            <div style={{ background: "var(--gl-panel-sunk)", border: `1px solid ${snap.lastRecord.onAffinity ? "var(--gl-green)" : "var(--gl-orange)"}`, borderRadius: "var(--gl-radius-panel)", padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700 }}>{getCard(snap.lastRecord.lineCardId).name} — {snap.lastRecord.onAffinity ? "ON LINE" : "OFF LINE (½ effect)"}</div>
              <div style={{ fontSize: 18, fontWeight: "bold", marginTop: 4 }}>{snap.lastRecord.segmentTime.toFixed(2)}s <span style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)" }}>(par {snap.segment?.par.toFixed(1) ?? "—"}s)</span></div>
              {snap.lastRecord.coneCount > 0 && <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-red)" }}>{snap.lastRecord.coneCount} cone{snap.lastRecord.coneCount > 1 ? "s" : ""} (+{(snap.lastRecord.coneCount * 2).toFixed(0)}s)</div>}
              {snap.lastRecord.flowAfter > 0 && <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-teal)" }}>Flow — next segment −0.3s</div>}
            </div>
            <div style={{ marginTop: 8 }}>
              <Button tone="pink" size="lg" block onClick={() => act(() => event.nextSegment())}>Next</Button>
            </div>
          </div>
        )}

        {snap.phase === "betweenRuns" && (
          <div style={{ textAlign: "center", paddingTop: 30 }}>
            <div style={{ fontSize: "var(--gl-size-heading)", fontWeight: 700, color: "var(--gl-pink)", letterSpacing: 2 }}>
              {snap.runIndex < 0 ? "GRID UP" : `RUN ${snap.runIndex + 1} COMPLETE`}
            </div>
            {snap.runIndex >= 0 && snap.results.length > 0 && (
              <div style={{ margin: "14px 0" }}>
                {snap.results.map((r, i) => (
                  <div key={i} style={{ fontSize: "var(--gl-size-label)", color: r.dnf ? "var(--gl-red)" : "var(--gl-text-1)" }}>
                    Run {i + 1}: {r.dnf ? "DNF" : `${r.time.toFixed(2)}s${r.cones ? ` (${r.cones} cone${r.cones > 1 ? "s" : ""})` : ""}`}
                  </div>
                ))}
                <div style={{ fontSize: "var(--gl-size-label)", color: "var(--gl-gold)", marginTop: 6 }}>Best: {event.bestRun() ? event.bestRun().time.toFixed(2) + "s" : "—"} / Target {snap.targetTime.toFixed(2)}s</div>
              </div>
            )}
            {snap.runIndex < 0 && snap.hazardPreview.total > 0 && (
              <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-orange)", margin: "10px 0" }}>
                Tech inspection: {snap.hazardPreview.total} hazard card{snap.hazardPreview.total > 1 ? "s" : ""} in your deck
                {snap.hazardPreview.unknown > 0 ? ` (${snap.hazardPreview.unknown} unknown — no diagnostics)` : ""}
              </div>
            )}
            <Button tone="pink" size="lg" onClick={() => act(() => event.startRun())}>{snap.runIndex < 0 ? "First run" : `Run ${snap.runIndex + 2}`}</Button>
            {snap.runIndex >= 0 && event.bestRun() && (
              <div style={{ marginTop: 10 }}>
                <Button tone="violet" variant="outlined" size="sm" onClick={() => act(() => { event.endEventEarly(); })}>Bank best time, skip remaining runs</Button>
              </div>
            )}
          </div>
        )}

        {snap.phase === "eventDone" && (
          <div style={{ textAlign: "center", paddingTop: 30 }}>
            <div style={{ fontSize: "var(--gl-size-heading)", fontWeight: 700, color: event.summary().won ? "var(--gl-gold)" : "var(--gl-orange)", letterSpacing: 2, textTransform: "uppercase" }}>
              {event.summary().won ? "Target beaten" : event.summary().bestTime == null ? "Event DNF" : "Event complete"}
            </div>
            <div style={{ fontSize: 24, fontWeight: "bold", margin: "10px 0" }}>
              {event.summary().bestTime != null ? `${event.summary().bestTime.toFixed(2)}s` : "—"}
              <span style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)" }}> / {snap.targetTime.toFixed(2)}s target</span>
            </div>
            <Button tone="pink" size="lg" onClick={finishEvent}>See results</Button>
          </div>
        )}
    </Shell>
  );
}
