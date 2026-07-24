import { useState, useMemo } from "react";
import { CARS, MODS, TIRE_OPTIONS, GAUGE_DEFS, SEGMENTS as SEG_DATA } from "./game/data";
import { generateCourse, computeTarget, resolveDecision } from "./game/logic";
import { buildTrack } from "./game/track";
import TrackCanvas from "./components/TrackCanvas";
import HUD from "./components/HUD";
import DiceWidget from "./components/DiceWidget";
import CourseLog, { saveCourseToLog } from "./components/CourseLog";

const C = {
  pink: "#FF6EC7", teal: "#00F5D4", purple: "#1A0533", white: "#E8EAF6",
  orange: "#FF6B35", red: "#FF2D55", gold: "#FFD700", green: "#00C853",
  bg: "#0D0D1A", panel: "#12122A", panel2: "#0a0a14", border: "#242440",
};

const SEG_COLOR = Object.fromEntries(Object.entries(SEG_DATA).map(([k, v]) => [k, v.color]));
const SEG_DESC = Object.fromEntries(Object.entries(SEG_DATA).map(([k, v]) => [k, v.desc]));
const SEG_LABEL = Object.fromEntries(Object.entries(SEG_DATA).map(([k, v]) => [k, `${v.icon} ${v.label}`]));

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, color: C.teal, letterSpacing: 2, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}
function cardBtnStyle(active) {
  return { flex: 1, textAlign: "left", padding: 10, background: active ? "#1c1c3a" : C.panel, border: `1px solid ${active ? C.pink : C.border}`, borderRadius: 4, cursor: "pointer", color: C.white };
}
function ToggleRow({ label, desc, active, onClick }) {
  return (
    <button onClick={onClick} style={{ textAlign: "left", padding: 8, background: active ? "#122b28" : C.panel, border: `1px solid ${active ? C.teal : C.border}`, borderRadius: 4, cursor: "pointer", color: C.white }}>
      <div style={{ fontSize: 10, fontWeight: "bold" }}>{active ? "☑" : "☐"} {label}</div>
      <div style={{ fontSize: 8, color: "#777" }}>{desc}</div>
    </button>
  );
}

function SetupScreen({ onStart, onViewLog }) {
  const [car, setCar] = useState("miata");
  const [mods, setMods] = useState({});
  const [tire, setTire] = useState("street_perf");
  const [gauges, setGauges] = useState({});
  const [maintenance, setMaintenance] = useState({ fluids: true, tires: true, brakes: true });

  return (
    <div style={{ minHeight: "100%", background: C.bg, color: C.white, fontFamily: "monospace", padding: 20 }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: "bold", color: C.pink, letterSpacing: 3 }}>GARAGE LIFE</div>
            <div style={{ fontSize: 11, color: C.teal, letterSpacing: 2 }}>AUTOCROSS — TIME TRIAL SETUP</div>
          </div>
          <button onClick={onViewLog} style={{ padding: "8px 12px", background: C.panel, color: C.gold, border: `1px solid ${C.gold}`, borderRadius: 4, cursor: "pointer", fontFamily: "monospace", fontSize: 9 }}>📋 COURSE LOG</button>
        </div>

        <Section title="CHOOSE YOUR CAR">
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(CARS).map(([id, c]) => (
              <button key={id} onClick={() => setCar(id)} style={cardBtnStyle(car === id)}>
                <div style={{ fontWeight: "bold", fontSize: 11 }}>{c.name}</div>
                <div style={{ fontSize: 9, color: "#888", marginTop: 4 }}>{c.blurb}</div>
                <div style={{ fontSize: 9, color: C.teal, marginTop: 6 }}>HP {c.hp} · HDL {c.handling} · GRIP {c.grip} · TRN {c.trans}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="INSTALLED MODS">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {MODS.map(m => (
              <ToggleRow key={m.id} label={m.label} desc={m.desc} active={!!mods[m.id]} onClick={() => setMods(s => ({ ...s, [m.id]: !s[m.id] }))} />
            ))}
          </div>
        </Section>

        <Section title="TIRE COMPOUND">
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(TIRE_OPTIONS).map(([id, t]) => (
              <button key={id} onClick={() => setTire(id)} style={cardBtnStyle(tire === id)}>
                <div style={{ fontSize: 10, fontWeight: "bold" }}>{t.label}</div>
                <div style={{ fontSize: 9, color: "#888" }}>Grip +{t.grip} · Wear ×{t.wearRate}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="GAUGES (visibility, not performance)">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {GAUGE_DEFS.map(g => (
              <ToggleRow key={g.id} label={g.label} desc={`Reveals ${g.covers} stress`} active={!!gauges[g.id]} onClick={() => setGauges(s => ({ ...s, [g.id]: !s[g.id] }))} />
            ))}
          </div>
        </Section>

        <Section title="PRE-RACE MAINTENANCE CHECKLIST">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            <ToggleRow label="Check Fluids" desc="Skip = engine risk" active={maintenance.fluids} onClick={() => setMaintenance(s => ({ ...s, fluids: !s.fluids }))} />
            <ToggleRow label="Check Tires"  desc="Skip = tire risk"   active={maintenance.tires}  onClick={() => setMaintenance(s => ({ ...s, tires: !s.tires }))} />
            <ToggleRow label="Check Brakes" desc="Skip = brake risk"  active={maintenance.brakes} onClick={() => setMaintenance(s => ({ ...s, brakes: !s.brakes }))} />
          </div>
        </Section>

        <div style={{ textAlign: "center", fontSize: 9, color: "#666", margin: "12px 0", lineHeight: 1.5 }}>
          Your course is randomly generated on rollout — a new track every run, logged to your Course Log after.
        </div>

        <button onClick={() => onStart({ car, mods, tire, gauges, maintenance })} style={{ width: "100%", padding: "14px 0", background: C.pink, color: C.purple, border: "none", borderRadius: 4, fontFamily: "monospace", fontWeight: "bold", fontSize: 13, cursor: "pointer", letterSpacing: 2 }}>
          ROLL OUT →
        </button>
      </div>
    </div>
  );
}

function RaceScreen({ loadout, onFinish }) {
  const course = useMemo(() => generateCourse(), []);
  const target = useMemo(() => computeTarget(course, loadout.car), [course, loadout.car]);
  const seed = useMemo(() => Math.random(), [course]);
  const track = useMemo(() => buildTrack(course, seed), [course, seed]);

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("decide");
  const [wear, setWear] = useState({ engine: 100, tires: 100, brakes: 100, trans: 100 });
  const [log, setLog] = useState([]);
  const [totalTime, setTotalTime] = useState(0);
  const [cones, setCones] = useState(0);
  const [blindPenalty, setBlindPenalty] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [rollToken, setRollToken] = useState(0);
  const [rollValue, setRollValue] = useState(1);

  const segKey = course[idx];
  const decisionsFor = SEG_DATA[segKey].decisions;

  const handleDecision = (decisionIdx) => {
    const { segTime, newWear, outcome, logEntry } = resolveDecision(segKey, decisionIdx, loadout, wear);
    setWear(newWear);
    setTotalTime(t => t + segTime);
    if (outcome.isCone) setCones(c => c + 1);
    if (outcome.blind) setBlindPenalty(b => b + outcome.penalty);
    setLog(l => [...l, logEntry]);
    setLastResult(logEntry);
    setRollValue(outcome.roll);
    setRollToken(tok => tok + 1);
    setPhase("reveal");
  };

  const nextSegment = () => {
    if (idx + 1 >= course.length) {
      const finalWon = totalTime <= target;
      saveCourseToLog({ track, car: loadout.car, time: totalTime, target, won: finalWon, at: Date.now() });
      onFinish({ course, log, totalTime, cones, blindPenalty, wear, loadout, target, track });
    } else {
      setIdx(i => i + 1);
      setPhase("decide");
      setLastResult(null);
    }
  };

  const carT = phase === "decide" ? 0.1 : 0.9;

  return (
    <div style={{ minHeight: "100%", background: C.bg, color: C.white, fontFamily: "monospace", padding: 20 }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>SEGMENT {idx + 1} / {course.length}</div>

        <TrackCanvas track={track} activeSegIndex={idx} carT={carT} />
        <div style={{ height: 10 }} />
        <HUD loadout={loadout} wear={wear} totalTime={totalTime} target={target} track={track} activeSegIndex={idx} carT={carT} />

        <div style={{ background: C.panel, border: `2px solid ${SEG_COLOR[segKey]}`, borderRadius: 6, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 18, marginBottom: 4, color: SEG_COLOR[segKey], fontWeight: "bold" }}>{SEG_LABEL[segKey]}</div>
          <div style={{ fontSize: 11, color: "#aaa" }}>{SEG_DESC[segKey]}</div>
        </div>

        {phase === "decide" && (
          <div>
            <div style={{ fontSize: 9, color: C.teal, letterSpacing: 2, marginBottom: 8 }}>YOUR DRIVING DECISION</div>
            {decisionsFor.map((d, i) => (
              <button key={d.id} onClick={() => handleDecision(i)} style={{ width: "100%", textAlign: "left", padding: 12, marginBottom: 8, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4, cursor: "pointer", color: C.white }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "bold", fontSize: 11 }}>{d.label}</span>
                  <span style={{ fontSize: 10, color: C.gold }}>~{d.time.toFixed(1)}s base</span>
                </div>
                <div style={{ fontSize: 9, color: "#888" }}>{d.desc}</div>
              </button>
            ))}
          </div>
        )}

        {phase === "reveal" && lastResult && (
          <div>
            <div style={{ background: C.panel2, border: `1px solid ${lastResult.color}`, borderRadius: 6, padding: 14, marginBottom: 12, textAlign: "center" }}>
              <div style={{ fontSize: 24 }}>{lastResult.icon}</div>
              <div style={{ fontSize: 13, fontWeight: "bold", color: lastResult.color }}>{lastResult.card}</div>
              <div style={{ fontSize: 9, color: "#666" }}>rolled {lastResult.roll}</div>
              <div style={{ fontSize: 16, fontWeight: "bold", marginTop: 6, color: C.white }}>{lastResult.time.toFixed(3)}s</div>
              {lastResult.blind && <div style={{ fontSize: 9, color: C.red, marginTop: 4 }}>⚠ BLIND HAZARD — no gauge coverage</div>}
            </div>
            <button onClick={nextSegment} style={{ width: "100%", padding: 12, background: C.pink, color: C.purple, border: "none", borderRadius: 4, fontFamily: "monospace", fontWeight: "bold", cursor: "pointer", letterSpacing: 1 }}>
              {idx + 1 >= course.length ? "SEE RESULTS →" : "NEXT SEGMENT →"}
            </button>
          </div>
        )}
      </div>

      <DiceWidget rollToken={rollToken} value={rollValue} label="CONSEQUENCE DIE" />
    </div>
  );
}

function ResultsScreen({ result, onRestart, onRebuild, onViewLog }) {
  const { log, totalTime, cones, blindPenalty, wear, target, track } = result;
  const diff = totalTime - target;
  const won = diff <= 0;

  return (
    <div style={{ minHeight: "100%", background: C.bg, color: C.white, fontFamily: "monospace", padding: 20 }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <TrackCanvas track={track} activeSegIndex={-1} carT={0} />
        <div style={{ height: 12 }} />

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: "bold", color: won ? C.gold : C.orange, letterSpacing: 2 }}>{won ? "🏆 TARGET BEATEN" : "RUN COMPLETE"}</div>
          <div style={{ fontSize: 26, fontWeight: "bold", marginTop: 6 }}>{totalTime.toFixed(3)}s</div>
          <div style={{ fontSize: 11, color: won ? C.green : C.red }}>{diff > 0 ? "+" : ""}{diff.toFixed(3)}s vs target ({target.toFixed(1)}s)</div>
          {cones > 0 && <div style={{ fontSize: 10, color: C.red, marginTop: 4 }}>🔺 {cones} cone{cones > 1 ? "s" : ""} hit</div>}
          {blindPenalty > 0 && <div style={{ fontSize: 10, color: C.red, marginTop: 2 }}>⚠ {blindPenalty.toFixed(2)}s lost to unseen hazards — install gauges to see them coming</div>}
        </div>

        <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4, padding: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: C.teal, letterSpacing: 2, marginBottom: 6 }}>SECTOR BREAKDOWN</div>
          {log.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 9, color: "#999", width: 70 }}>{s.seg}</span>
              <span style={{ fontSize: 8, color: "#666", flex: 1 }}>{s.decision}</span>
              <span style={{ fontSize: 9, color: s.color }}>{s.icon} {s.card} (d6:{s.roll})</span>
              <span style={{ fontSize: 10, fontWeight: "bold", width: 50, textAlign: "right" }}>{s.time.toFixed(3)}s</span>
            </div>
          ))}
        </div>

        <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4, padding: 10, marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: C.teal, letterSpacing: 2, marginBottom: 6 }}>WEAR REPORT (post-run)</div>
          <div style={{ display: "flex", gap: 16, justifyContent: "space-around" }}>
            {[["Engine", wear.engine], ["Tires", wear.tires], ["Brakes", wear.brakes], ["Trans", wear.trans]].map(([l, v]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 8, color: "#777" }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: "bold", color: v > 60 ? C.green : v > 30 ? C.orange : C.red }}>{Math.round(v)}%</div>
              </div>
            ))}
          </div>
          {Object.values(wear).some(v => v < 40) && <div style={{ fontSize: 9, color: C.orange, marginTop: 8 }}>⚠ Systems below 40% — service before your next run</div>}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onRebuild} style={{ flex: 1, padding: 12, background: C.purple, color: C.pink, border: `1px solid ${C.pink}`, borderRadius: 4, cursor: "pointer", fontFamily: "monospace", fontSize: 11 }}>← REBUILD CAR</button>
          <button onClick={onViewLog} style={{ flex: 1, padding: 12, background: C.panel, color: C.gold, border: `1px solid ${C.gold}`, borderRadius: 4, cursor: "pointer", fontFamily: "monospace", fontSize: 11 }}>📋 COURSE LOG</button>
          <button onClick={onRestart} style={{ flex: 1, padding: 12, background: C.pink, color: C.purple, border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "monospace", fontSize: 11, fontWeight: "bold" }}>RUN AGAIN →</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("setup");
  const [loadout, setLoadout] = useState(null);
  const [result, setResult] = useState(null);
  const [prevScreen, setPrevScreen] = useState("setup");

  if (screen === "setup") return <SetupScreen onStart={(l) => { setLoadout(l); setScreen("race"); }} onViewLog={() => { setPrevScreen("setup"); setScreen("log"); }} />;
  if (screen === "race") return <RaceScreen loadout={loadout} onFinish={(r) => { setResult(r); setScreen("results"); }} />;
  if (screen === "log") return <CourseLog onBack={() => setScreen(prevScreen)} />;
  return (
    <ResultsScreen
      result={result}
      onRebuild={() => setScreen("setup")}
      onRestart={() => setScreen("race")}
      onViewLog={() => { setPrevScreen("results"); setScreen("log"); }}
    />
  );
}
