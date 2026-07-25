import { useState, useEffect } from "react";
import {
  createNewCareer, advanceAfterAction, resolveWork, resolveJobHunt,
  computeRaceReward, checkModUnlocks, checkCarUnlocks, computeSeasonGrade, MAINTAIN_COST, SELF_MAINTAIN_COST,
} from "./game/career";
import { loadMeta, unlockMod, unlockCar, archiveCareer } from "./game/meta";
import { saveCareerSnapshot, loadCareerSnapshot } from "./game/careerStore";
import TitleScreen from "./components/TitleScreen";
import TrackCanvas from "./components/TrackCanvas";
import CourseLog from "./components/CourseLog";
import CardRaceScreen from "./components/CardRaceScreen";
import NewCareerScreen from "./components/NewCareerScreen";
import CareerHome from "./components/CareerHome";
import PreRaceSetup from "./components/PreRaceSetup";
import ActionResultScreen from "./components/ActionResultScreen";
import SeasonSummaryScreen from "./components/SeasonSummaryScreen";
import { C } from "./theme";

function RaceResultScreen({ result, onContinue, onViewLog }) {
  const { bestTime, targetTime, bestCones, runs, wearAfter, track, reward } = result;
  const won = bestTime != null && bestTime <= targetTime;
  const diff = bestTime != null ? bestTime - targetTime : null;

  return (
    <div style={{ minHeight: "100%", background: C.bg, color: C.white, fontFamily: "monospace", padding: 20 }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <TrackCanvas track={track} activeSegIndex={-1} carT={0} />
        <div style={{ height: 12 }} />

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: "bold", color: won ? C.gold : C.orange, letterSpacing: 2 }}>{won ? "🏆 TARGET BEATEN" : bestTime == null ? "EVENT DNF" : "EVENT COMPLETE"}</div>
          <div style={{ fontSize: 26, fontWeight: "bold", marginTop: 6 }}>{bestTime != null ? `${bestTime.toFixed(2)}s` : "—"}</div>
          {diff != null && <div style={{ fontSize: 11, color: won ? C.green : C.red }}>{diff > 0 ? "+" : ""}{diff.toFixed(2)}s vs target ({targetTime.toFixed(2)}s)</div>}
          {bestCones > 0 && <div style={{ fontSize: 10, color: C.red, marginTop: 4 }}>🔺 {bestCones} cone{bestCones > 1 ? "s" : ""} on your best run</div>}
          {reward && (
            <div style={{ fontSize: 13, fontWeight: "bold", marginTop: 10, color: C.gold }}>
              +${reward.cash} cash{reward.reputation > 0 ? ` · +${reward.reputation} reputation` : ""}
            </div>
          )}
        </div>

        <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4, padding: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: C.teal, letterSpacing: 2, marginBottom: 6 }}>RUN SHEET</div>
          {runs.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 9, color: "#999" }}>Run {i + 1}</span>
              <span style={{ fontSize: 9, color: r.dnf ? C.red : "#ccc", flex: 1, textAlign: "center" }}>
                {r.dnf ? "DNF" : `${r.time.toFixed(2)}s`}{r.cones ? ` · ${r.cones} 🔺` : ""}
              </span>
              <span style={{ fontSize: 10, fontWeight: "bold", color: !r.dnf && r.time === bestTime ? C.gold : "#666" }}>
                {!r.dnf && r.time === bestTime ? "BEST" : ""}
              </span>
            </div>
          ))}
        </div>

        <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 4, padding: 10, marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: C.teal, letterSpacing: 2, marginBottom: 6 }}>WEAR REPORT (post-event)</div>
          <div style={{ display: "flex", gap: 16, justifyContent: "space-around" }}>
            {[["Engine", wearAfter.engine], ["Tires", wearAfter.tires], ["Brakes", wearAfter.brakes], ["Trans", wearAfter.trans]].map(([l, v]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 8, color: "#777" }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: "bold", color: v > 60 ? C.green : v > 30 ? C.orange : C.red }}>{Math.round(v)}%</div>
              </div>
            ))}
          </div>
          {Object.values(wearAfter).some(v => v < 40) && <div style={{ fontSize: 9, color: C.orange, marginTop: 8 }}>⚠ Systems below 40% — spend a Maintain action before your next event</div>}
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
  const [screen, setScreen] = useState("title");
  const [prevScreen, setPrevScreen] = useState("careerHome");
  const [loadout, setLoadout] = useState(null);
  const [raceResult, setRaceResult] = useState(null);
  const [actionResult, setActionResult] = useState(null);
  const [seasonEnded, setSeasonEnded] = useState(false);
  const [seasonGrade, setSeasonGrade] = useState(null);

  // Persist the in-progress career after every state change so "Continue
  // Career" on the title screen survives a closed tab. Meta (unlocks) has
  // its own persistence in meta.js; this is just the current run.
  useEffect(() => {
    if (career) saveCareerSnapshot({ career, seasonEnded, seasonGrade });
  }, [career, seasonEnded, seasonGrade]);

  const continueCareer = () => {
    const snap = loadCareerSnapshot();
    if (!snap) return;
    // Normalize saves from before the tire-purchase system existed.
    setCareer({ ownedTires: ["stock"], ...snap.career });
    setSeasonEnded(snap.seasonEnded ?? false);
    setSeasonGrade(snap.seasonGrade ?? null);
    setScreen(snap.seasonEnded ? "seasonSummary" : "careerHome");
  };

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
    setLoadout(l);
    setScreen("race");
  };

  // Card-game event result (from CardRaceScreen/AutocrossEvent): bestTime of
  // 4 runs vs engine target; DNF events pay the minimum finisher's purse.
  const handleRaceFinish = (result) => {
    const reward = computeRaceReward({
      totalTime: result.bestTime ?? result.targetTime + 99,
      target: result.targetTime,
      conesHit: result.bestCones,
      blindHazardCount: result.hazardsFiredInBest,
    });
    const updated = {
      ...career,
      cash: career.cash + reward.cash,
      reputation: career.reputation + reward.reputation,
      lifetimeCashEarned: career.lifetimeCashEarned + reward.cash,
      racesEntered: career.racesEntered + 1,
      wins: career.wins + (reward.won ? 1 : 0),
      cleanWins: career.cleanWins + (reward.cleanWin ? 1 : 0),
      wear: result.wearAfter,
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

  if (screen === "title") return (
    <TitleScreen
      hasSave={Boolean(loadCareerSnapshot())}
      onNewGame={() => setScreen("newCareer")}
      onContinue={continueCareer}
    />
  );
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
    <PreRaceSetup
      career={career} meta={meta} onStart={handleStartRace} onBack={() => setScreen("careerHome")}
      onBuyTire={(tireId, price) => {
        if (career.cash < price || (career.ownedTires ?? []).includes(tireId)) return;
        setCareer({ ...career, cash: career.cash - price, ownedTires: [...(career.ownedTires ?? ["stock"]), tireId] });
      }}
    />
  );
  if (screen === "race") return <CardRaceScreen loadout={loadout} careerWear={career.wear} month={career.month} onFinish={handleRaceFinish} />;
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
