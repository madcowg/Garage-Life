import { useState } from "react";
import { SEGMENTS as SEG_DATA } from "./game/data";
import { generateCourse, computeTarget, resolveDecision } from "./game/logic";
import { buildTrack } from "./game/track";
import {
  createNewCareer, advanceAfterAction, resolveWork, resolveJobHunt,
  computeRaceReward, checkModUnlocks, checkCarUnlocks, computeSeasonGrade, MAINTAIN_COST, SELF_MAINTAIN_COST,
} from "./game/career";
import { loadMeta, unlockMod, unlockCar, archiveCareer } from "./game/meta";
import TrackCanvas from "./components/TrackCanvas";
import RoadView from "./components/RoadView";
import HUD from "./components/HUD";
import DiceWidget from "./components/DiceWidget";
import CourseLog, { saveCourseToLog } from "./components/CourseLog";
import NewCareerScreen from "./components/NewCareerScreen";
import CareerHome from "./components/CareerHome";
import PreRaceSetup from "./components/PreRaceSetup";
import ActionResultScreen from "./components/ActionResultScreen";
import SeasonSummaryScreen from "./components/SeasonSummaryScreen";
import { C } from "./theme";

const SEG_COLOR = Object.fromEntries(Object.entries(SEG_DATA).map(([k, v]) => [k, v.color]));
const SEG_DESC = Object.fromEntries(Object.entries(SEG_DATA).map(([k, v]) => [k, v.desc]));
const SEG_LABEL = Object.fromEntries(Object.entries(SEG_DATA).map(([k, v]) => [k, `${v.icon} ${v.label}`]));

// A couple of courses through the season get palm-tree/sunset scenery
// (Outrun vaporwave vibe) instead of the default plain sunset — pure
// scenery variety, tied to the calendar month, no gameplay effect.
function courseThemeForMonth(month) {
  return month % 3 === 0 ? "palm" : "default";
}

function RaceScreen({ loadout, session, initialWear, month, onFinish }) {
  const { course, target, track } = session;

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("decide");
  const [wear, setWear] = useState(initialWear);
  const [log, setLog] = useState([]);
  const [totalTime, setTotalTime] = useState(0);
  const [cones, setCones] = useState(0);
  const [blindPenalty, setBlindPenalty] = useState(0);
  const [blindHazardCount, setBlindHazardCount] = useState(0);
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
    if (outcome.blind) {
      setBlindPenalty(b => b + outcome.penalty);
      setBlindHazardCount(n => n + 1);
    }
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
      onFinish({ course, log, totalTime, cones, blindPenalty, blindHazardCount, wear, loadout, target, track });
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

        <RoadView track={track} activeSegIndex={idx} carT={carT} carId={loadout.car} variant={loadout.variant} theme={courseThemeForMonth(month)} />
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

      <DiceWidget rollToken={rollToken} value={rollValue} label="CONSEQUENCE DIE" rawRoll={lastResult?.rawRoll} secondRoll={lastResult?.secondRoll} modifier={lastResult?.modifier} />
    </div>
  );
}

function RaceResultScreen({ result, onContinue, onViewLog }) {
  const { log, totalTime, cones, blindPenalty, wear, target, track, reward } = result;
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
          {reward && (
            <div style={{ fontSize: 13, fontWeight: "bold", marginTop: 10, color: C.gold }}>
              +${reward.cash} cash{reward.reputation > 0 ? ` · +${reward.reputation} reputation` : ""}
            </div>
          )}
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
          {Object.values(wear).some(v => v < 40) && <div style={{ fontSize: 9, color: C.orange, marginTop: 8 }}>⚠ Systems below 40% — spend a Maintain action before your next race</div>}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onViewLog} style={{ flex: 1, padding: 12, background: C.panel, color: C.gold, border: `1px solid ${C.gold}`, borderRadius: 4, cursor: "pointer", fontFamily: "monospace", fontSize: 11 }}>📋 COURSE LOG</button>
          <button onClick={onContinue} style={{ flex: 1, padding: 12, background: C.pink, color: C.purple, border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "monospace", fontSize: 11, fontWeight: "bold" }}>CONTINUE →</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [meta, setMeta] = useState(() => loadMeta());
  const [career, setCareer] = useState(null);
  const [screen, setScreen] = useState("newCareer");
  const [prevScreen, setPrevScreen] = useState("careerHome");
  const [session, setSession] = useState(null);
  const [loadout, setLoadout] = useState(null);
  const [raceResult, setRaceResult] = useState(null);
  const [actionResult, setActionResult] = useState(null);
  const [seasonEnded, setSeasonEnded] = useState(false);
  const [seasonGrade, setSeasonGrade] = useState(null);

  const applyUnlocks = (updatedCareer, currentMeta) => {
    const newMods = checkModUnlocks(updatedCareer.lifetimeCashEarned, currentMeta.unlockedMods);
    const newCars = checkCarUnlocks({ reputation: updatedCareer.reputation, wins: updatedCareer.wins }, currentMeta.unlockedCars);
    let nextMeta = currentMeta;
    newMods.forEach(id => { nextMeta = unlockMod(nextMeta, id); });
    newCars.forEach(id => { nextMeta = unlockCar(nextMeta, id); });
    const newlyUnlocked = [...newMods, ...newCars];
    return { meta: nextMeta, career: { ...updatedCareer, unlocksEarned: [...updatedCareer.unlocksEarned, ...newlyUnlocked] } };
  };

  const finishSeason = (finalCareer, finalMeta) => {
    const grade = computeSeasonGrade({ wins: finalCareer.wins, races: finalCareer.racesEntered, reputation: finalCareer.reputation });
    const summary = {
      seasonGrade: grade, finalCar: { id: finalCareer.car, variant: finalCareer.variant },
      totalCash: finalCareer.lifetimeCashEarned, totalReputation: finalCareer.reputation,
      races: { entered: finalCareer.racesEntered, won: finalCareer.wins, cleanWins: finalCareer.cleanWins },
      unlocksEarned: finalCareer.unlocksEarned, completedAt: Date.now(),
    };
    const archivedMeta = archiveCareer(finalMeta, summary);
    setMeta(archivedMeta);
    setCareer(finalCareer);
    setSeasonGrade(grade);
    setSeasonEnded(true);
  };

  const startCareer = ({ car, variant }) => {
    setCareer(createNewCareer(car, variant));
    setSeasonEnded(false);
    setSeasonGrade(null);
    setScreen("careerHome");
  };

  const goHomeOrSummary = () => setScreen(seasonEnded ? "seasonSummary" : "careerHome");

  const handleStartRace = (l) => {
    const course = generateCourse();
    const target = computeTarget(course, l.car);
    const track = buildTrack(course, Math.random());
    setLoadout(l);
    setSession({ course, target, track });
    setScreen("race");
  };

  const handleRaceFinish = (result) => {
    const reward = computeRaceReward({ totalTime: result.totalTime, target: result.target, conesHit: result.cones, blindHazardCount: result.blindHazardCount });
    const updated = {
      ...career,
      cash: career.cash + reward.cash,
      reputation: career.reputation + reward.reputation,
      lifetimeCashEarned: career.lifetimeCashEarned + reward.cash,
      racesEntered: career.racesEntered + 1,
      wins: career.wins + (reward.won ? 1 : 0),
      cleanWins: career.cleanWins + (reward.cleanWin ? 1 : 0),
      wear: result.wear,
    };
    const { meta: nextMeta, career: unlockedCareer } = applyUnlocks(updated, meta);
    setMeta(nextMeta);
    const { career: advanced, seasonEnded: ended } = advanceAfterAction(unlockedCareer);
    setRaceResult({ ...result, reward });
    if (ended) finishSeason(advanced, nextMeta);
    else setCareer(advanced);
    setScreen("raceResult");
  };

  const handleWork = () => {
    if (career.employment.status === "unemployed") {
      const hunt = resolveJobHunt();
      const newEmployment = hunt.success
        ? { ...career.employment, status: hunt.instant ? "employed" : "pending", tenureMonths: 0 }
        : career.employment;
      const { career: advanced, seasonEnded: ended } = advanceAfterAction({ ...career, employment: newEmployment });
      const result = hunt.success
        ? { title: hunt.instant ? "HIRED — NATURAL 20!" : "HIRED", icon: "🎉", color: C.green,
            message: hunt.instant ? "Hired on the spot — you can Work again this month." : "Hired! Your new job starts next month.",
            detail: `Rolled ${hunt.rawRoll}` }
        : { title: "STILL LOOKING", icon: "😕", color: C.orange, message: "No luck this month (need 11+ on a d20). Try again next month.", detail: `Rolled ${hunt.rawRoll}` };
      if (ended) finishSeason(advanced, meta);
      else setCareer(advanced);
      setActionResult(result);
      setScreen("actionResult");
      return;
    }

    const work = resolveWork(career.employment);
    const updated = {
      ...career,
      cash: career.cash + work.cash,
      lifetimeCashEarned: career.lifetimeCashEarned + work.cash,
      employment: work.newEmployment,
    };
    const { meta: nextMeta, career: unlockedCareer } = applyUnlocks(updated, meta);
    setMeta(nextMeta);
    const { career: advanced, seasonEnded: ended } = advanceAfterAction(unlockedCareer);

    const EVENT_STYLE = {
      fired: ["FIRED", "💥", C.red], bad_economy: ["SLOW MONTH", "📉", C.orange],
      bonus: ["BONUS!", "🎁", C.gold], promoted: ["PROMOTED!", "⭐", C.gold], normal: ["PAYDAY", "💼", C.teal],
    };
    const [title, icon, color] = EVENT_STYLE[work.event];
    const detail = `Rolled ${work.rawRoll}${work.modifier ? ` +${work.modifier} tenure → ${work.effectiveRoll}` : ""}${work.promoRoll ? ` — promotion roll (d10): ${work.promoRoll}` : ""}`;

    if (ended) finishSeason(advanced, nextMeta);
    else setCareer(advanced);
    setActionResult({ title, icon, color, message: work.message, detail, cashDelta: work.cash });
    setScreen("actionResult");
  };

  const handleMaintain = () => {
    const selfService = career.employment.status === "unemployed";
    const cost = selfService ? SELF_MAINTAIN_COST : MAINTAIN_COST;
    const updated = { ...career, cash: career.cash - cost, wear: { engine: 100, tires: 100, brakes: 100, trans: 100 } };
    const { career: advanced, seasonEnded: ended } = advanceAfterAction(updated);
    if (ended) finishSeason(advanced, meta);
    else setCareer(advanced);
    setActionResult({
      title: "SERVICED", icon: "🔧", color: C.green,
      message: selfService
        ? "Full service complete, done yourself in the driveway — engine, tires, brakes, and trans restored to 100%."
        : "Full service complete — engine, tires, brakes, and trans restored to 100%.",
      cashDelta: -cost,
    });
    setScreen("actionResult");
  };

  if (screen === "newCareer") return <NewCareerScreen meta={meta} onStart={startCareer} />;
  if (screen === "careerHome") return (
    <CareerHome
      career={career}
      onRace={() => setScreen("preRaceSetup")}
      onWork={handleWork}
      onMaintain={handleMaintain}
      onViewLog={() => { setPrevScreen("careerHome"); setScreen("log"); }}
    />
  );
  if (screen === "preRaceSetup") return (
    <PreRaceSetup career={career} meta={meta} onStart={handleStartRace} onBack={() => setScreen("careerHome")} />
  );
  if (screen === "race") return <RaceScreen loadout={loadout} session={session} initialWear={career.wear} month={career.month} onFinish={handleRaceFinish} />;
  if (screen === "raceResult") return (
    <RaceResultScreen result={raceResult} onContinue={goHomeOrSummary} onViewLog={() => { setPrevScreen("raceResult"); setScreen("log"); }} />
  );
  if (screen === "actionResult") return (
    <ActionResultScreen {...actionResult} onContinue={goHomeOrSummary} />
  );
  if (screen === "seasonSummary") return (
    <SeasonSummaryScreen career={career} grade={seasonGrade} unlocksEarned={career.unlocksEarned} onNewCareer={() => setScreen("newCareer")} />
  );
  if (screen === "log") return <CourseLog onBack={() => setScreen(prevScreen)} />;
  return null;
}
