import { useState, useEffect } from "react";
import {
  createNewCareer, advanceAfterAction, resolveWork, resolveJobHunt,
  resolveJunkyard, resolveStreetRace,
  computeRaceReward, checkModUnlocks, checkCarUnlocks, computeSeasonGrade,
  MAINTAIN_COST, SELF_MAINTAIN_COST, ENTRY_FEE, SEASON_GRADE_STORY_TRIGGER,
} from "./game/career";
import { loadMeta, unlockMod, unlockCar, unlockAchievement, applyTriggerUnlocks, archiveCareer } from "./game/meta";
import { getNewStoryTriggers, resolveTriggerUnlocks, pickSnippetText, PER_CAREER_TRIGGERS } from "./game/story";
import { MODS } from "./game/data";
import { saveCareerSnapshot, loadCareerSnapshot } from "./game/careerStore";
import TitleScreen from "./components/TitleScreen";
import { Shell, CashBadge } from "./components/shared";
import TrackCanvas from "./components/TrackCanvas";
import CourseLog from "./components/CourseLog";
import CardRaceScreen from "./components/CardRaceScreen";
import NewCareerScreen from "./components/NewCareerScreen";
import CareerHome from "./components/CareerHome";
import PreRaceSetup from "./components/PreRaceSetup";
import ActionResultScreen from "./components/ActionResultScreen";
import SeasonSummaryScreen from "./components/SeasonSummaryScreen";
import StorySnippetScreen from "./components/StorySnippetScreen";
import CodexScreen from "./components/CodexScreen";
import ShopScreen from "./components/ShopScreen";
import { C } from "./theme";

function clampWear(v) { return Math.max(0, Math.min(100, v)); }

function RaceResultScreen({ result, onContinue, onViewLog }) {
  const { bestTime, targetTime, bestCones, runs, wearAfter, track, reward } = result;
  const won = bestTime != null && bestTime <= targetTime;
  const diff = bestTime != null ? bestTime - targetTime : null;

  return (
    <Shell maxWidth={600}>
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
    </Shell>
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
  const [storyQueue, setStoryQueue] = useState([]);
  const [storyReturnScreen, setStoryReturnScreen] = useState("careerHome");

  // Persist the in-progress career after every state change so "Continue
  // Career" on the title screen survives a closed tab. Meta (unlocks) has
  // its own persistence in meta.js; this is just the current run.
  useEffect(() => {
    if (career) saveCareerSnapshot({ career, seasonEnded, seasonGrade });
  }, [career, seasonEnded, seasonGrade]);

  const continueCareer = () => {
    const snap = loadCareerSnapshot();
    if (!snap) return;
    // Normalize saves from before the tire-purchase / story / AP-economy
    // systems existed.
    setCareer({
      ownedTires: ["stock"], eventsRegistered: 0, storySeen: [],
      installedMods: [], racedThisMonth: false, maintainedThisMonth: false,
      ...snap.career,
    });
    setSeasonEnded(snap.seasonEnded ?? false);
    setSeasonGrade(snap.seasonGrade ?? null);
    setScreen(snap.seasonEnded ? "seasonSummary" : "careerHome");
  };

  // Diffs career state before/after an action for newly-fired story beats
  // (game/story.js), applies their permanent codex/achievement payoff to
  // meta immediately, and marks per-career triggers as seen. Returns the
  // updated career/meta plus which triggers fired (caller decides whether
  // to route through the "story" screen before landing on afterScreen).
  const runStoryCheck = (prevCareer, nextCareer, extra, currentMeta) => {
    const triggers = getNewStoryTriggers({ prevCareer, nextCareer, ...extra });
    if (triggers.length === 0) return { career: nextCareer, meta: currentMeta, triggers };
    let nextMeta = currentMeta;
    triggers.forEach(t => { nextMeta = applyTriggerUnlocks(nextMeta, resolveTriggerUnlocks(t, { carId: nextCareer.car })); });
    const newlySeen = triggers.filter(t => PER_CAREER_TRIGGERS.has(t));
    const careerWithSeen = { ...nextCareer, storySeen: [...(nextCareer.storySeen || []), ...newlySeen] };
    return { career: careerWithSeen, meta: nextMeta, triggers };
  };

  // Lands on afterScreen directly, or detours through the story screen
  // first if any triggers fired this action.
  const proceedAfterStory = (triggers, afterScreen) => {
    if (triggers.length > 0) {
      setStoryQueue(triggers);
      setStoryReturnScreen(afterScreen);
      setScreen("story");
    } else {
      setScreen(afterScreen);
    }
  };

  const handleStoryContinue = () => {
    const rest = storyQueue.slice(1);
    if (rest.length > 0) setStoryQueue(rest);
    else { setStoryQueue([]); setScreen(storyReturnScreen); }
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

  // The season doesn't end on a bare calendar cutoff — the last scored event
  // concludes the local points chase, and the grade decides the Nationals
  // bid (see career.js SEASON_GRADE_STORY_TRIGGER). extraTriggers carries
  // any per-career story beats (e.g. final_month) that fired the same action.
  const finishSeason = (finalCareer, finalMeta, extraTriggers = []) => {
    const grade = computeSeasonGrade({ wins: finalCareer.wins, races: finalCareer.racesEntered, reputation: finalCareer.reputation });
    const seasonEndTrigger = SEASON_GRADE_STORY_TRIGGER[grade];
    const metaWithSeasonEnd = applyTriggerUnlocks(finalMeta, resolveTriggerUnlocks(seasonEndTrigger));
    const summary = {
      seasonGrade: grade, finalCar: { id: finalCareer.car, variant: finalCareer.variant },
      totalCash: finalCareer.lifetimeCashEarned, totalReputation: finalCareer.reputation,
      races: { entered: finalCareer.racesEntered, won: finalCareer.wins, cleanWins: finalCareer.cleanWins },
      unlocksEarned: finalCareer.unlocksEarned, completedAt: Date.now(),
    };
    const archivedMeta = archiveCareer(metaWithSeasonEnd, summary);
    setMeta(archivedMeta);
    setCareer(finalCareer);
    setSeasonGrade(grade);
    setSeasonEnded(true);
    proceedAfterStory([...extraTriggers, seasonEndTrigger], "seasonSummary");
  };

  const startCareer = ({ car, variant }) => {
    const newCareer = createNewCareer(car, variant);
    const nextMeta = applyTriggerUnlocks(meta, resolveTriggerUnlocks("career_start", { carId: car }));
    setMeta(nextMeta);
    setCareer({ ...newCareer, storySeen: ["career_start"] });
    setSeasonEnded(false);
    setSeasonGrade(null);
    proceedAfterStory(["career_start"], "careerHome");
  };

  const goHomeOrSummary = () => setScreen(seasonEnded ? "seasonSummary" : "careerHome");

  // Real autocross events cost a flat entry fee regardless of outcome —
  // paid at registration, not deducted from the eventual purse. PreRaceSetup
  // disables the button when unaffordable; this guard covers stale state.
  // Only one sanctioned event runs a month, so this also locks Race out
  // until next month's rollover (CareerHome disables the button too).
  const handleStartRace = (l) => {
    if (career.cash < ENTRY_FEE || career.racedThisMonth) return;
    const paid = { ...career, cash: career.cash - ENTRY_FEE, eventsRegistered: career.eventsRegistered + 1, racedThisMonth: true };
    const { career: careerWithStory, meta: metaWithStory, triggers } = runStoryCheck(career, paid, {}, meta);
    setMeta(metaWithStory);
    setCareer(careerWithStory);
    setLoadout(l);
    proceedAfterStory(triggers, "race");
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
    const newMods = checkModUnlocks(updated.lifetimeCashEarned, meta.unlockedMods);
    const newCars = checkCarUnlocks({ reputation: updated.reputation, wins: updated.wins }, meta.unlockedCars);
    const { meta: nextMeta, career: unlockedCareer } = applyUnlocks(updated, meta);
    let metaWithAch = nextMeta;
    if (reward.cleanWin) metaWithAch = unlockAchievement(metaWithAch, "clean_win");
    if (MODS.every(m => metaWithAch.unlockedMods.includes(m.id))) metaWithAch = unlockAchievement(metaWithAch, "stage1_complete");

    const { career: advanced, seasonEnded: ended } = advanceAfterAction(unlockedCareer);
    const { career: careerWithStory, meta: metaWithStory, triggers } = runStoryCheck(career, advanced, { newMods, newCars }, metaWithAch);
    setRaceResult({ ...result, reward });
    if (ended) {
      finishSeason(careerWithStory, metaWithStory, triggers);
    } else {
      setMeta(metaWithStory);
      setCareer(careerWithStory);
      proceedAfterStory(triggers, "raceResult");
    }
  };

  const handleWork = () => {
    if (career.employment.status === "unemployed") {
      const hunt = resolveJobHunt();
      const newEmployment = hunt.success
        ? { ...career.employment, status: hunt.instant ? "employed" : "pending", tenureMonths: 0 }
        : career.employment;
      const { career: advanced, seasonEnded: ended } = advanceAfterAction({ ...career, employment: newEmployment });
      const { career: careerWithStory, meta: metaWithStory, triggers } = runStoryCheck(career, advanced, {}, meta);
      const result = hunt.success
        ? { title: hunt.instant ? "HIRED — NATURAL 20!" : "HIRED", icon: "🎉", color: C.green,
            message: hunt.instant ? "Hired on the spot — you can Work again this month." : "Hired! Your new job starts next month.",
            detail: `Rolled ${hunt.rawRoll}` }
        : { title: "STILL LOOKING", icon: "😕", color: C.orange, message: "No luck this month (need 11+ on a d20). Try again next month.", detail: `Rolled ${hunt.rawRoll}` };
      setActionResult(result);
      if (ended) {
        finishSeason(careerWithStory, metaWithStory, triggers);
      } else {
        setMeta(metaWithStory);
        setCareer(careerWithStory);
        proceedAfterStory(triggers, "actionResult");
      }
      return;
    }

    const work = resolveWork(career.employment);
    const updated = {
      ...career,
      cash: career.cash + work.cash,
      lifetimeCashEarned: career.lifetimeCashEarned + work.cash,
      employment: work.newEmployment,
    };
    const newMods = checkModUnlocks(updated.lifetimeCashEarned, meta.unlockedMods);
    const { meta: nextMeta, career: unlockedCareer } = applyUnlocks(updated, meta);
    const { career: advanced, seasonEnded: ended } = advanceAfterAction(unlockedCareer);
    const { career: careerWithStory, meta: metaWithStory, triggers } = runStoryCheck(career, advanced, { newMods }, nextMeta);

    const EVENT_STYLE = {
      fired: ["FIRED", "💥", C.red], bad_economy: ["SLOW MONTH", "📉", C.orange],
      bonus: ["BONUS!", "🎁", C.gold], promoted: ["PROMOTED!", "⭐", C.gold], normal: ["PAYDAY", "💼", C.teal],
    };
    const [title, icon, color] = EVENT_STYLE[work.event];
    const detail = `Rolled ${work.rawRoll}${work.modifier ? ` +${work.modifier} tenure → ${work.effectiveRoll}` : ""}${work.promoRoll ? ` — promotion roll (d10): ${work.promoRoll}` : ""}`;

    setActionResult({ title, icon, color, message: work.message, detail, cashDelta: work.cash });
    if (ended) {
      finishSeason(careerWithStory, metaWithStory, triggers);
    } else {
      setMeta(metaWithStory);
      setCareer(careerWithStory);
      proceedAfterStory(triggers, "actionResult");
    }
  };

  const handleMaintain = () => {
    if (career.maintainedThisMonth) return;
    const selfService = career.employment.status === "unemployed";
    const cost = selfService ? SELF_MAINTAIN_COST : MAINTAIN_COST;
    const updated = { ...career, cash: career.cash - cost, wear: { engine: 100, tires: 100, brakes: 100, trans: 100 }, maintainedThisMonth: true };
    const { career: advanced, seasonEnded: ended } = advanceAfterAction(updated);
    const { career: careerWithStory, meta: metaWithStory, triggers } = runStoryCheck(career, advanced, {}, meta);
    setActionResult({
      title: "SERVICED", icon: "🔧", color: C.green,
      message: selfService
        ? "Full service complete, done yourself in the driveway — engine, tires, brakes, and trans restored to 100%."
        : "Full service complete — engine, tires, brakes, and trans restored to 100%.",
      cashDelta: -cost,
    });
    if (ended) {
      finishSeason(careerWithStory, metaWithStory, triggers);
    } else {
      setMeta(metaWithStory);
      setCareer(careerWithStory);
      proceedAfterStory(triggers, "actionResult");
    }
  };

  // Shop (Dead Reckoning Garage) — browsing/buying/installing is free;
  // the AP is spent on "HEAD OUT" (handleLeaveShop), same commitment
  // pattern as paying a race entry fee. Buying a tire is a plain cash
  // purchase; installing a mod requires it be unlocked in meta first
  // (Rex will sell it) and just adds it to this career's installedMods —
  // no extra cash cost beyond what already unlocked it.
  const handleBuyTire = (tireId, price) => {
    if (career.cash < price || (career.ownedTires ?? []).includes(tireId)) return;
    setCareer({ ...career, cash: career.cash - price, ownedTires: [...(career.ownedTires ?? ["stock"]), tireId] });
  };

  const handleInstallMod = (modId) => {
    if (!meta.unlockedMods.includes(modId) || (career.installedMods ?? []).includes(modId)) return;
    setCareer({ ...career, installedMods: [...(career.installedMods ?? []), modId] });
  };

  const handleLeaveShop = () => {
    const { career: advanced, seasonEnded: ended } = advanceAfterAction(career);
    const { career: careerWithStory, meta: metaWithStory, triggers } = runStoryCheck(career, advanced, {}, meta);
    if (ended) {
      finishSeason(careerWithStory, metaWithStory, triggers);
    } else {
      setMeta(metaWithStory);
      setCareer(careerWithStory);
      proceedAfterStory(triggers, "careerHome");
    }
  };

  const handleJunkyard = () => {
    const roll = resolveJunkyard();
    const updated = { ...career, cash: career.cash + roll.cash, lifetimeCashEarned: career.lifetimeCashEarned + roll.cash };
    const newMods = checkModUnlocks(updated.lifetimeCashEarned, meta.unlockedMods);
    const { meta: nextMeta, career: unlockedCareer } = applyUnlocks(updated, meta);
    const { career: advanced, seasonEnded: ended } = advanceAfterAction(unlockedCareer);
    const { career: careerWithStory, meta: metaWithStory, triggers } = runStoryCheck(career, advanced, { newMods }, nextMeta);
    setActionResult({
      title: roll.event === "nothing" ? "EMPTY HANDED" : "JUNKYARD RUN", icon: "🗑️",
      color: roll.event === "nothing" ? "#888" : C.gold, message: roll.message, cashDelta: roll.cash,
    });
    if (ended) finishSeason(careerWithStory, metaWithStory, triggers);
    else { setMeta(metaWithStory); setCareer(careerWithStory); proceedAfterStory(triggers, "actionResult"); }
  };

  const handleStreetRace = () => {
    const roll = resolveStreetRace(career.wear.tires);
    const updated = {
      ...career, cash: Math.max(0, career.cash + roll.cash),
      lifetimeCashEarned: career.lifetimeCashEarned + Math.max(0, roll.cash),
      wear: { ...career.wear, tires: clampWear(career.wear.tires + roll.tireWearDelta) },
    };
    const { career: advanced, seasonEnded: ended } = advanceAfterAction(updated);
    const { career: careerWithStory, meta: metaWithStory, triggers } = runStoryCheck(career, advanced, {}, meta);
    setActionResult({
      title: roll.event === "busted" ? "BUSTED" : "STREET RACING", icon: "🌃",
      color: roll.event === "busted" ? C.red : C.gold, message: roll.message, cashDelta: roll.cash,
    });
    if (ended) finishSeason(careerWithStory, metaWithStory, triggers);
    else { setMeta(metaWithStory); setCareer(careerWithStory); proceedAfterStory(triggers, "actionResult"); }
  };

  // Cash stays on screen everywhere a career's in progress — race, shop,
  // codex, story beats, all of it — not just CareerHome.
  const withCash = (el) => (career ? <>{el}<CashBadge cash={career.cash} /></> : el);

  if (screen === "story") {
    const seed = career ? `${career.car}-${career.month}-${career.wins}-${career.reputation}` : "";
    return withCash(<StorySnippetScreen text={pickSnippetText(storyQueue[0], seed)} onContinue={handleStoryContinue} />);
  }
  if (screen === "title") return withCash(
    <TitleScreen
      hasSave={Boolean(loadCareerSnapshot())}
      onNewGame={() => setScreen("newCareer")}
      onContinue={continueCareer}
      onCodex={() => { setPrevScreen("title"); setScreen("codex"); }}
    />
  );
  if (screen === "newCareer") return withCash(<NewCareerScreen meta={meta} onStart={startCareer} />);
  if (screen === "careerHome") return withCash(
    <CareerHome
      career={career}
      onRace={() => setScreen("preRaceSetup")}
      onWork={handleWork}
      onMaintain={handleMaintain}
      onShop={() => setScreen("shop")}
      onJunkyard={handleJunkyard}
      onStreetRace={handleStreetRace}
      onViewLog={() => { setPrevScreen("careerHome"); setScreen("log"); }}
      onViewCodex={() => { setPrevScreen("careerHome"); setScreen("codex"); }}
    />
  );
  if (screen === "preRaceSetup") return withCash(
    <PreRaceSetup career={career} onStart={handleStartRace} onBack={() => setScreen("careerHome")} />
  );
  if (screen === "shop") return withCash(
    <ShopScreen career={career} meta={meta} onBuyTire={handleBuyTire} onInstallMod={handleInstallMod} onLeave={handleLeaveShop} />
  );
  if (screen === "race") return withCash(<CardRaceScreen loadout={loadout} careerWear={career.wear} month={career.month} onFinish={handleRaceFinish} />);
  if (screen === "raceResult") return withCash(
    <RaceResultScreen result={raceResult} onContinue={goHomeOrSummary} onViewLog={() => { setPrevScreen("raceResult"); setScreen("log"); }} />
  );
  if (screen === "actionResult") return withCash(
    <ActionResultScreen {...actionResult} onContinue={goHomeOrSummary} />
  );
  if (screen === "seasonSummary") return withCash(
    <SeasonSummaryScreen career={career} grade={seasonGrade} unlocksEarned={career.unlocksEarned} onNewCareer={() => setScreen("newCareer")} />
  );
  if (screen === "log") return withCash(<CourseLog onBack={() => setScreen(prevScreen)} />);
  if (screen === "codex") return withCash(<CodexScreen meta={meta} onBack={() => setScreen(prevScreen)} />);
  return null;
}
