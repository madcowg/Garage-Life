import { useState, useEffect } from "react";
import {
  createNewCareer, advanceAfterAction, spendAp, checkMonthRollover, resolveWork, resolveJobHunt,
  resolveJunkyard, resolveStreetRace, JUNKYARD_CAR_CLAIM_PRICE, JUNKYARD_UPGRADE_PRICE,
  computeRaceReward, checkModUnlocks, checkCarUnlocks, computeSeasonGrade,
  computeRacingCredDelta, computeRaceNpcDeltas, effectiveEntryFee, discountedTirePrice,
  NPC_STANDING_THRESHOLDS, NPC_ENGAGE_STANDING_DELTA, NPC_ENGAGE_CRED_DELTA,
  MAINTAIN_COST, SELF_MAINTAIN_COST, ENTRY_FEE, SEASON_GRADE_STORY_TRIGGER,
  tireSellPrice, CAR_SELL_PRICE, SEASON_MIDPOINT_MONTH,
} from "./game/career";
import { loadMeta, unlockMod, unlockCar, unlockAchievement, applyTriggerUnlocks, archiveCareer } from "./game/meta";
import { getNewStoryTriggers, resolveTriggerUnlocks, pickSnippetText, PER_CAREER_TRIGGERS, ACHIEVEMENTS, NPC_ENGAGE_LINES } from "./game/story";
import { MODS, CARS, TIRE_CATALOG } from "./game/data";
import { saveCareerSnapshot, loadCareerSnapshot } from "./game/careerStore";
import TitleScreen from "./components/TitleScreen";
import IntroScreen from "./components/IntroScreen";
import { Shell, CashBadge } from "./components/shared";
import AchievementToast from "./components/AchievementToast";
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
import { CrtOverlay } from "./components/ds/shell/CrtOverlay";
import { Button } from "./components/ds/controls/Button";
import { scanlinesEnabled, setScanlinesEnabled } from "./theme";

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
          <div style={{ fontSize: "var(--gl-size-heading)", fontWeight: 700, color: won ? "var(--gl-gold)" : "var(--gl-orange)", letterSpacing: 2, textTransform: "uppercase" }}>{won ? "Target beaten" : bestTime == null ? "Event DNF" : "Event complete"}</div>
          <div style={{ fontSize: 26, fontWeight: "bold", marginTop: 6 }}>{bestTime != null ? `${bestTime.toFixed(2)}s` : "—"}</div>
          {diff != null && <div style={{ fontSize: "var(--gl-size-label)", color: won ? "var(--gl-green)" : "var(--gl-red)" }}>{diff > 0 ? "+" : ""}{diff.toFixed(2)}s vs target ({targetTime.toFixed(2)}s)</div>}
          {bestCones > 0 && <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-red)", marginTop: 4 }}>{bestCones} cone{bestCones > 1 ? "s" : ""} on your best run</div>}
          {reward && (
            <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700, marginTop: 10, color: "var(--gl-gold)" }}>
              +${reward.cash} cash{reward.reputation > 0 ? ` · +${reward.reputation} reputation` : ""}
            </div>
          )}
        </div>

        <div style={{ background: "var(--gl-panel-sunk)", border: "1px solid var(--gl-border)", borderRadius: "var(--gl-radius-panel)", padding: 10, marginBottom: 12 }}>
          <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-teal)", letterSpacing: 2, marginBottom: 6 }}>RUN SHEET</div>
          {runs.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--gl-border)" }}>
              <span style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)" }}>Run {i + 1}</span>
              <span style={{ fontSize: "var(--gl-size-micro)", color: r.dnf ? "var(--gl-red)" : "var(--gl-text-1)", flex: 1, textAlign: "center" }}>
                {r.dnf ? "DNF" : `${r.time.toFixed(2)}s`}{r.cones ? ` · ${r.cones} cone${r.cones > 1 ? "s" : ""}` : ""}
              </span>
              <span style={{ fontSize: "var(--gl-size-micro)", fontWeight: 700, color: !r.dnf && r.time === bestTime ? "var(--gl-gold)" : "var(--gl-text-dead)" }}>
                {!r.dnf && r.time === bestTime ? "BEST" : ""}
              </span>
            </div>
          ))}
        </div>

        <div style={{ background: "var(--gl-panel-sunk)", border: "1px solid var(--gl-border)", borderRadius: "var(--gl-radius-panel)", padding: 10, marginBottom: 16 }}>
          <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-teal)", letterSpacing: 2, marginBottom: 6 }}>WEAR REPORT (post-event)</div>
          <div style={{ display: "flex", gap: 16, justifyContent: "space-around" }}>
            {[["Engine", wearAfter.engine], ["Tires", wearAfter.tires], ["Brakes", wearAfter.brakes], ["Trans", wearAfter.trans]].map(([l, v]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-text-3)" }}>{l}</div>
                <div style={{ fontSize: "var(--gl-size-label)", fontWeight: 700, color: v > 60 ? "var(--gl-green)" : v > 30 ? "var(--gl-orange)" : "var(--gl-red)" }}>{Math.round(v)}%</div>
              </div>
            ))}
          </div>
          {Object.values(wearAfter).some(v => v < 40) && <div style={{ fontSize: "var(--gl-size-micro)", color: "var(--gl-orange)", marginTop: 8 }}>Systems below 40% — spend a Maintain action before your next event</div>}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button tone="gold" variant="outlined" block onClick={onViewLog}>Course log</Button>
          <Button tone="pink" block onClick={onContinue}>Continue</Button>
        </div>
    </Shell>
  );
}

export default function App() {
  const [meta, setMeta] = useState(() => loadMeta());
  const [career, setCareer] = useState(null);
  const [screen, setScreen] = useState("title");
  const [prevScreen, setPrevScreen] = useState("careerHome");
  const [codexTab, setCodexTab] = useState("npc");
  // Tracks whether this Shop visit actually bought/installed anything — the
  // AP charge on "Head out" (handleLeaveShop) only applies then, since it
  // represents Rex's labor, not the trip itself. Reset every time Shop opens.
  const [shopActedThisVisit, setShopActedThisVisit] = useState(false);
  // Last Rolodex "engage" outcome, shown inline under that NPC's card —
  // cleared whenever the player leaves the Codex screen.
  const [npcEngageResult, setNpcEngageResult] = useState(null);
  const [loadout, setLoadout] = useState(null);
  const [raceResult, setRaceResult] = useState(null);
  const [actionResult, setActionResult] = useState(null);
  const [seasonEnded, setSeasonEnded] = useState(false);
  const [seasonGrade, setSeasonGrade] = useState(null);
  const [storyQueue, setStoryQueue] = useState([]);
  const [storyReturnScreen, setStoryReturnScreen] = useState("careerHome");
  const [achievementPopupQueue, setAchievementPopupQueue] = useState([]);
  const [pendingPlayerName, setPendingPlayerName] = useState(null);
  const [scanlines, setScanlines] = useState(() => scanlinesEnabled());
  const toggleScanlines = () => {
    const next = !scanlines;
    setScanlinesEnabled(next);
    setScanlines(next);
  };

  // Every meta transition goes through here instead of setMeta directly, so
  // a newly-unlocked achievement (from ANY code path — story triggers,
  // checkStandingAchievements, a car sale, whatever) always gets queued for
  // the popup without every call site having to remember to do it itself.
  const updateMeta = (nextMeta) => {
    const before = meta.achievementsUnlocked ?? [];
    const newlyUnlocked = (nextMeta.achievementsUnlocked ?? []).filter(id => !before.includes(id));
    if (newlyUnlocked.length > 0) setAchievementPopupQueue(q => [...q, ...newlyUnlocked]);
    setMeta(nextMeta);
  };
  const dismissAchievementPopup = () => setAchievementPopupQueue(q => q.slice(1));

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
      installedMods: [], racedThisMonth: false, maintainedThisMonth: false, junkyardCarOffer: null,
      racingCred: 0, npcStanding: { rex: 0, dez: 0, marisol: 0, walt: 0 },
      dezFreeEntryUsed: false, waltFreeMaintainUsed: false,
      ownedCars: [snap.career.car], everOwnedMultipleCars: false, carsSoldCount: 0,
      playerName: "Paul Walker",
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

  // Permanent (meta) achievements tied to crossing the top Racing Cred /
  // NPC Standing tiers — checked after any action that can move either.
  const checkStandingAchievements = (updatedCareer, currentMeta) => {
    let nextMeta = currentMeta;
    if (updatedCareer.racingCred >= 30) nextMeta = unlockAchievement(nextMeta, "cred_legend");
    const allTrusted = Object.values(updatedCareer.npcStanding).every(v => v >= NPC_STANDING_THRESHOLDS.TRUSTED);
    if (allTrusted) nextMeta = unlockAchievement(nextMeta, "trusted_by_all");
    return nextMeta;
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
    const newCars = checkCarUnlocks({ reputation: updatedCareer.reputation, wins: updatedCareer.wins }, updatedCareer.npcStanding, currentMeta.unlockedCars);
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
    let metaWithSeasonEnd = applyTriggerUnlocks(finalMeta, resolveTriggerUnlocks(seasonEndTrigger));
    // Ride or Die: had a spare car available to sell all season and never did.
    if (finalCareer.everOwnedMultipleCars && (finalCareer.carsSoldCount ?? 0) === 0) {
      metaWithSeasonEnd = unlockAchievement(metaWithSeasonEnd, "ride_or_die");
    }
    const summary = {
      seasonGrade: grade, finalCar: { id: finalCareer.car, variant: finalCareer.variant },
      totalCash: finalCareer.lifetimeCashEarned, totalReputation: finalCareer.reputation,
      races: { entered: finalCareer.racesEntered, won: finalCareer.wins, cleanWins: finalCareer.cleanWins },
      unlocksEarned: finalCareer.unlocksEarned, completedAt: Date.now(),
    };
    const archivedMeta = archiveCareer(metaWithSeasonEnd, summary);
    updateMeta(archivedMeta);
    setCareer(finalCareer);
    setSeasonGrade(grade);
    setSeasonEnded(true);
    proceedAfterStory([...extraTriggers, seasonEndTrigger], "seasonSummary");
  };

  // Name comes from IntroScreen (a genuinely new game) when set; a season
  // rollover into its next career (SeasonSummaryScreen's onNewCareer, which
  // skips the intro entirely) instead carries the just-finished career's
  // name forward, so returning players are never asked twice.
  const startCareer = ({ car, variant }) => {
    const playerName = pendingPlayerName ?? career?.playerName ?? "Paul Walker";
    const newCareer = createNewCareer(car, variant, playerName);
    const nextMeta = applyTriggerUnlocks(meta, resolveTriggerUnlocks("career_start", { carId: car }));
    updateMeta(nextMeta);
    setCareer({ ...newCareer, storySeen: ["career_start"] });
    setPendingPlayerName(null);
    setSeasonEnded(false);
    setSeasonGrade(null);
    proceedAfterStory(["career_start"], "careerHome");
  };

  // Lou/Fanaz is a hidden second unlock path for the same secret car Fire
  // Sale grants (App.jsx handleSellCar) — no achievement here, just the car,
  // since typing a name isn't really an "achievement" to announce.
  const handleIntroContinue = (name) => {
    const lower = name.trim().toLowerCase();
    if (lower === "lou" || lower === "fanaz") updateMeta(unlockCar(meta, "beaterVan"));
    setPendingPlayerName(name);
    setScreen("newCareer");
  };

  const goHomeOrSummary = () => setScreen(seasonEnded ? "seasonSummary" : "careerHome");

  // Real autocross events cost a flat entry fee regardless of outcome, plus
  // whatever event prep / maintenance checks the player opted into (their
  // cash cost — PreRaceSetup computes totalCost = entry + prep). Paid at
  // registration, not deducted from the eventual purse. PreRaceSetup
  // disables the button when unaffordable; this guard covers stale state.
  // Only one sanctioned event runs a month, so this also locks Race out
  // until next month's rollover (CareerHome disables the button too).
  //
  // AP is committed here too, not at finish — extraAp (DIY prep, resolved
  // immediately as its own mini-action) plus 1 for the race itself, spent
  // with spendAp() so an out-of-AP registration is blocked up front instead
  // of quietly rolling the month over mid-race. The month/season rollover
  // that 1 AP might trigger still waits for handleRaceFinish's
  // checkMonthRollover(), since the race isn't actually over yet.
  // dezCoversEntry: true when PreRaceSetup detected Dez's one-time Trusted
  // favor applies and already zeroed the entry-fee portion of totalCost —
  // this just marks the favor spent so it doesn't apply again.
  const handleStartRace = (l, totalCost = ENTRY_FEE, extraAp = 0, dezCoversEntry = false) => {
    const apNeeded = extraAp + 1;
    if (career.cash < totalCost || career.racedThisMonth || career.ap < apNeeded) return;
    let working = career;
    for (let i = 0; i < extraAp; i++) working = advanceAfterAction(working).career;
    working = spendAp(working, 1);
    const paid = {
      ...working, cash: working.cash - totalCost, eventsRegistered: working.eventsRegistered + 1, racedThisMonth: true,
      dezFreeEntryUsed: dezCoversEntry ? true : working.dezFreeEntryUsed,
    };
    const { career: careerWithStory, meta: metaWithStory, triggers } = runStoryCheck(career, paid, {}, meta);
    updateMeta(metaWithStory);
    setCareer(careerWithStory);
    setLoadout(l);
    proceedAfterStory(triggers, "race");
  };

  // Card-game event result (from CardRaceScreen/AutocrossEvent): bestTime of
  // 4 runs vs engine target; DNF events pay the minimum finisher's purse.
  // Also moves Racing Cred (clean win up, DNF/sloppy down) and Dez/Marisol's
  // NPC Standing — see career.js computeRacingCredDelta/computeRaceNpcDeltas.
  const handleRaceFinish = (result) => {
    const reward = computeRaceReward({
      totalTime: result.bestTime ?? result.targetTime + 99,
      target: result.targetTime,
      conesHit: result.bestCones,
      blindHazardCount: result.hazardsFiredInBest,
    });
    const dnf = result.bestTime == null;
    const credDelta = computeRacingCredDelta({ dnf, cleanWin: reward.cleanWin, cones: result.bestCones ?? 0 });
    const marginSeconds = reward.won ? result.targetTime - result.bestTime : 0;
    const npcDeltas = computeRaceNpcDeltas({ won: reward.won, cleanWin: reward.cleanWin, marginSeconds });
    const updated = {
      ...career,
      cash: career.cash + reward.cash,
      reputation: career.reputation + reward.reputation,
      lifetimeCashEarned: career.lifetimeCashEarned + reward.cash,
      racesEntered: career.racesEntered + 1,
      wins: career.wins + (reward.won ? 1 : 0),
      cleanWins: career.cleanWins + (reward.cleanWin ? 1 : 0),
      wear: result.wearAfter,
      racingCred: career.racingCred + credDelta,
      npcStanding: {
        ...career.npcStanding,
        dez: career.npcStanding.dez + npcDeltas.dez,
        marisol: career.npcStanding.marisol + npcDeltas.marisol,
      },
    };
    const newMods = checkModUnlocks(updated.lifetimeCashEarned, meta.unlockedMods);
    const newCars = checkCarUnlocks({ reputation: updated.reputation, wins: updated.wins }, updated.npcStanding, meta.unlockedCars);
    const { meta: nextMeta, career: unlockedCareer } = applyUnlocks(updated, meta);
    let metaWithAch = checkStandingAchievements(unlockedCareer, nextMeta);
    if (reward.cleanWin) metaWithAch = unlockAchievement(metaWithAch, "clean_win");
    if (MODS.every(m => metaWithAch.unlockedMods.includes(m.id))) metaWithAch = unlockAchievement(metaWithAch, "stage1_complete");

    // AP for this race was already spent at registration (handleStartRace) —
    // just check whether that made the month/season roll over, don't spend
    // again.
    const { career: advanced, seasonEnded: ended } = checkMonthRollover(unlockedCareer);
    const { career: careerWithStory, meta: metaWithStory, triggers } = runStoryCheck(career, advanced, { newMods, newCars }, metaWithAch);
    setRaceResult({ ...result, reward });
    if (ended) {
      finishSeason(careerWithStory, metaWithStory, triggers);
    } else {
      updateMeta(metaWithStory);
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
        ? { title: hunt.instant ? "HIRED — NATURAL 20!" : "HIRED", tone: "green",
            message: hunt.instant ? "Hired on the spot — you can Work again this month." : "Hired! Your new job starts next month.",
            detail: `Rolled ${hunt.rawRoll}` }
        : { title: "STILL LOOKING", tone: "orange", message: "No luck this month (need 11+ on a d20). Try again next month.", detail: `Rolled ${hunt.rawRoll}` };
      setActionResult(result);
      if (ended) {
        finishSeason(careerWithStory, metaWithStory, triggers);
      } else {
        updateMeta(metaWithStory);
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
      fired: ["FIRED", "red"], bad_economy: ["SLOW MONTH", "orange"],
      bonus: ["BONUS!", "gold"], promoted: ["PROMOTED!", "gold"], normal: ["PAYDAY", "teal"],
    };
    const [title, tone] = EVENT_STYLE[work.event];
    const detail = `Rolled ${work.rawRoll}${work.modifier ? ` +${work.modifier} tenure → ${work.effectiveRoll}` : ""}${work.promoRoll ? ` — promotion roll (d10): ${work.promoRoll}` : ""}`;

    setActionResult({ title, tone, message: work.message, detail, cashDelta: work.cash });
    if (ended) {
      finishSeason(careerWithStory, metaWithStory, triggers);
    } else {
      updateMeta(metaWithStory);
      setCareer(careerWithStory);
      proceedAfterStory(triggers, "actionResult");
    }
  };

  const handleMaintain = () => {
    if (career.maintainedThisMonth) return;
    const selfService = career.employment.status === "unemployed";
    // Walt's one-time favor at Trusted standing: he waves the bill once.
    const waltCovers = (career.npcStanding?.walt ?? 0) >= NPC_STANDING_THRESHOLDS.TRUSTED && !career.waltFreeMaintainUsed;
    const cost = waltCovers ? 0 : (selfService ? SELF_MAINTAIN_COST : MAINTAIN_COST);
    const updated = {
      ...career, cash: career.cash - cost, wear: { engine: 100, tires: 100, brakes: 100, trans: 100 }, maintainedThisMonth: true,
      waltFreeMaintainUsed: waltCovers ? true : career.waltFreeMaintainUsed,
    };
    const { career: advanced, seasonEnded: ended } = advanceAfterAction(updated);
    const { career: careerWithStory, meta: metaWithStory, triggers } = runStoryCheck(career, advanced, {}, meta);
    setActionResult({
      title: "SERVICED", tone: "green",
      message: waltCovers
        ? "Walt waves you off before you can even reach for your wallet. \"Trusted regulars don't pay for this one. Consider it even.\""
        : selfService
        ? "Full service complete, done yourself in the driveway — engine, tires, brakes, and trans restored to 100%."
        : "Full service complete — engine, tires, brakes, and trans restored to 100%.",
      cashDelta: -cost,
    });
    if (ended) {
      finishSeason(careerWithStory, metaWithStory, triggers);
    } else {
      updateMeta(metaWithStory);
      setCareer(careerWithStory);
      proceedAfterStory(triggers, "actionResult");
    }
  };

  // Shop (Dead Reckoning Garage) — just browsing is free; the AP on "HEAD
  // OUT" (handleLeaveShop) only gets charged if this visit actually bought
  // or installed something (shopActedThisVisit), since it represents Rex's
  // labor/the transaction, not the trip itself. Buying a tire is a plain
  // cash purchase; installing a mod needs it unlocked in meta first (Rex
  // will sell it) and now also costs its real cash price (MODS in data.js),
  // charged on top of whatever lifetime-earned threshold already unlocked it.
  // Rex's standing rises with every transaction (business is business) and
  // discounts future tire prices in turn — see ShopScreen, which computes
  // the same discountedTirePrice() so the displayed price always matches
  // what actually gets charged here.
  const handleBuyTire = (tireId, price) => {
    if (career.cash < price || (career.ownedTires ?? []).includes(tireId)) return;
    const updated = {
      ...career, cash: career.cash - price, ownedTires: [...(career.ownedTires ?? ["stock"]), tireId],
      npcStanding: { ...career.npcStanding, rex: career.npcStanding.rex + 4 },
    };
    updateMeta(checkStandingAchievements(updated, meta));
    setCareer(updated);
    setShopActedThisVisit(true);
  };

  // Installing a mod bumps both Rex (business) and Walt (respects a
  // properly built car) — same transaction, two different reasons to care.
  const handleInstallMod = (modId, price) => {
    if (!meta.unlockedMods.includes(modId) || (career.installedMods ?? []).includes(modId) || career.cash < price) return;
    const updated = {
      ...career, cash: career.cash - price, installedMods: [...(career.installedMods ?? []), modId],
      npcStanding: { ...career.npcStanding, rex: career.npcStanding.rex + 4, walt: career.npcStanding.walt + 4 },
    };
    updateMeta(checkStandingAchievements(updated, meta));
    setCareer(updated);
    setShopActedThisVisit(true);
  };

  // Selling equipment you own but aren't using — must always keep at least
  // one tire, and can't sell a tire another owned tire still requires
  // (slicks needs extreme_summer; selling the requirement out from under it
  // would leave an inconsistent TIRE_CATALOG state).
  const handleSellTire = (tireId) => {
    const owned = career.ownedTires ?? ["stock"];
    if (!owned.includes(tireId) || owned.length <= 1) return;
    const stillDependent = Object.entries(TIRE_CATALOG).some(([id, t]) => t.requires === tireId && owned.includes(id));
    if (stillDependent) return;
    const price = tireSellPrice(tireId);
    setCareer({ ...career, cash: career.cash + price, ownedTires: owned.filter(id => id !== tireId) });
  };

  // Selling a spare car (never the one you're actively driving — switching
  // active cars mid-career isn't a thing yet). Selling before the season's
  // halfway point is a "Fire Sale" — the achievement payoff also unlocks a
  // secret car (Rex's one available beater once you've flipped your good one).
  const handleSellCar = (carId) => {
    const owned = career.ownedCars ?? [career.car];
    if (carId === career.car || !owned.includes(carId) || owned.length <= 1) return;
    const updated = {
      ...career, cash: career.cash + CAR_SELL_PRICE,
      ownedCars: owned.filter(id => id !== carId),
      carsSoldCount: (career.carsSoldCount ?? 0) + 1,
    };
    let nextMeta = meta;
    if (career.month < SEASON_MIDPOINT_MONTH) {
      nextMeta = unlockAchievement(nextMeta, "fire_sale");
      nextMeta = unlockCar(nextMeta, "beaterVan");
    }
    updateMeta(nextMeta);
    setCareer(updated);
  };

  // Rolodex "engage" — 1 AP to spend a beat with an already-met NPC,
  // dating-sim-esque: friendly raises their standing and your Racing Cred,
  // antagonize lowers both. Stays on the codex screen throughout (no
  // screen transition), same reasoning as CodexScreen being a pure browsing
  // screen elsewhere — a story trigger can still detour through the story
  // screen first, same as every other action.
  const handleEngageNpc = (npcId, mode) => {
    if (!career || career.ap <= 0) return;
    const delta = mode === "friendly" ? NPC_ENGAGE_STANDING_DELTA : -NPC_ENGAGE_STANDING_DELTA;
    const credDelta = mode === "friendly" ? NPC_ENGAGE_CRED_DELTA : -NPC_ENGAGE_CRED_DELTA;
    const updated = {
      ...career,
      npcStanding: { ...career.npcStanding, [npcId]: career.npcStanding[npcId] + delta },
      racingCred: career.racingCred + credDelta,
    };
    const { career: advanced, seasonEnded: ended } = advanceAfterAction(updated);
    const metaWithAch = checkStandingAchievements(advanced, meta);
    const { career: careerWithStory, meta: metaWithStory, triggers } = runStoryCheck(career, advanced, {}, metaWithAch);
    setNpcEngageResult({ npcId, mode, message: NPC_ENGAGE_LINES[npcId][mode] });
    if (ended) {
      finishSeason(careerWithStory, metaWithStory, triggers);
    } else {
      updateMeta(metaWithStory);
      setCareer(careerWithStory);
      proceedAfterStory(triggers, "codex");
    }
  };

  const handleLeaveShop = () => {
    // Pure browsing — nothing bought or installed — costs nothing, same as
    // Back on any other screen.
    if (!shopActedThisVisit) { setScreen("careerHome"); return; }
    const { career: advanced, seasonEnded: ended } = advanceAfterAction(career);
    const { career: careerWithStory, meta: metaWithStory, triggers } = runStoryCheck(career, advanced, {}, meta);
    if (ended) {
      finishSeason(careerWithStory, metaWithStory, triggers);
    } else {
      updateMeta(metaWithStory);
      setCareer(careerWithStory);
      proceedAfterStory(triggers, "careerHome");
    }
  };

  // d20 table (career.js resolveJunkyard): nat-1 pays the yard's look-around
  // fee and finds nothing; nat-19 is a Stage 1 mod for a steal (bypasses the
  // usual lifetime-earned unlock threshold — a genuine lucky break, but
  // this career's equipment only, same as installedMods generally); nat-20
  // finds a locked car sitting in the yard, offered as a time-limited claim
  // (JUNKYARD_CAR_CLAIM_PRICE within a month — see career.junkyardCarOffer).
  // The special rolls fall back to cash when there's nothing left to give
  // (everything already installed, or an offer's already pending).
  const handleJunkyard = () => {
    const roll = resolveJunkyard();
    let cashDelta = roll.cash;
    let title = "JUNKYARD RUN";
    let tone = "gold";
    let message = roll.message;
    let installedModsNext = career.installedMods ?? [];
    let junkyardCarOfferNext = career.junkyardCarOffer;

    if (roll.event === "yard_fee") {
      title = "EMPTY HANDED";
      tone = "violet";
    } else if (roll.event === "cheap_upgrade") {
      const uninstalled = MODS.filter(m => !installedModsNext.includes(m.id));
      if (uninstalled.length > 0) {
        const pick = uninstalled[Math.floor(Math.random() * uninstalled.length)];
        installedModsNext = [...installedModsNext, pick.id];
        cashDelta = -JUNKYARD_UPGRADE_PRICE;
        title = "SCORE!";
        message = `Score! You found a ${pick.label} for $${JUNKYARD_UPGRADE_PRICE}.`;
      } else {
        cashDelta = 75 + Math.floor(Math.random() * 26);
        title = "SOLID FIND";
        message = "Went looking for a part to install, but everything's already on the car — sold the find instead for a tidy sum.";
      }
    } else if (roll.event === "car_find") {
      const lockedCars = Object.entries(CARS).filter(([id, c]) => c.tier === "unlockable" && !meta.unlockedCars.includes(id));
      if (lockedCars.length > 0 && !career.junkyardCarOffer) {
        const [carId, carDef] = lockedCars[Math.floor(Math.random() * lockedCars.length)];
        const expiresMonth = career.month + 1;
        junkyardCarOfferNext = { carId, expiresMonth };
        title = "JACKPOT!";
        message = `Under a tarp in the back row: a ${carDef.name}, running condition. The yard wants $${JUNKYARD_CAR_CLAIM_PRICE} to let it go, and you've got until month ${expiresMonth} to come up with it.`;
      } else if (career.junkyardCarOffer) {
        cashDelta = 75 + Math.floor(Math.random() * 26);
        title = "SOLID FIND";
        message = "Another great find, but the yard's only holding one car for you at a time — sold this one for parts instead.";
      } else {
        cashDelta = 90 + Math.floor(Math.random() * 36);
        title = "SCORE OF A LIFETIME";
        message = "Best haul the yard's had all year — every car worth unlocking is already yours, so this one just goes straight to cash.";
      }
    }

    const updated = {
      ...career, cash: career.cash + cashDelta, lifetimeCashEarned: career.lifetimeCashEarned + Math.max(0, cashDelta),
      installedMods: installedModsNext, junkyardCarOffer: junkyardCarOfferNext,
    };
    const newMods = checkModUnlocks(updated.lifetimeCashEarned, meta.unlockedMods);
    const { meta: nextMeta, career: unlockedCareer } = applyUnlocks(updated, meta);
    const { career: advanced, seasonEnded: ended } = advanceAfterAction(unlockedCareer);
    const { career: careerWithStory, meta: metaWithStory, triggers } = runStoryCheck(career, advanced, { newMods }, nextMeta);
    setActionResult({ title, tone, message, cashDelta });
    if (ended) finishSeason(careerWithStory, metaWithStory, triggers);
    else { updateMeta(metaWithStory); setCareer(careerWithStory); proceedAfterStory(triggers, "actionResult"); }
  };

  // Claiming the junkyard car offer is a straight cash transaction, no AP —
  // stays on CareerHome, banner just disappears once paid (or once it expires).
  const handleClaimJunkyardCar = () => {
    const offer = career.junkyardCarOffer;
    if (!offer || career.cash < JUNKYARD_CAR_CLAIM_PRICE) return;
    const nextMeta = unlockCar(meta, offer.carId);
    updateMeta(nextMeta);
    const owned = career.ownedCars ?? [career.car];
    setCareer({
      ...career, cash: career.cash - JUNKYARD_CAR_CLAIM_PRICE, junkyardCarOffer: null,
      unlocksEarned: [...career.unlocksEarned, offer.carId],
      ownedCars: [...owned, offer.carId], everOwnedMultipleCars: true,
    });
  };

  // Getting busted costs Racing Cred too — word gets around the sanctioned
  // scene, same as a DNF would. A clean pass or better doesn't help it
  // (it's still off the books — nobody's supposed to know it went well).
  const handleStreetRace = () => {
    const roll = resolveStreetRace(career.wear.tires);
    const updated = {
      ...career, cash: Math.max(0, career.cash + roll.cash),
      lifetimeCashEarned: career.lifetimeCashEarned + Math.max(0, roll.cash),
      wear: { ...career.wear, tires: clampWear(career.wear.tires + roll.tireWearDelta) },
      racingCred: career.racingCred + (roll.event === "busted" ? -3 : 0),
    };
    const { career: advanced, seasonEnded: ended } = advanceAfterAction(updated);
    const metaWithAch = checkStandingAchievements(advanced, meta);
    const { career: careerWithStory, meta: metaWithStory, triggers } = runStoryCheck(career, advanced, {}, metaWithAch);
    setActionResult({
      title: roll.event === "busted" ? "BUSTED" : "STREET RACING",
      tone: roll.event === "busted" ? "red" : "gold", message: roll.message, cashDelta: roll.cash,
    });
    if (ended) finishSeason(careerWithStory, metaWithStory, triggers);
    else { updateMeta(metaWithStory); setCareer(careerWithStory); proceedAfterStory(triggers, "actionResult"); }
  };

  // Cash stays on screen everywhere a career's in progress — race, shop,
  // codex, story beats, all of it — not just CareerHome.
  const activeAchievement = achievementPopupQueue[0] ? ACHIEVEMENTS.find(a => a.id === achievementPopupQueue[0]) : null;
  const withCash = (el) => (
    <>
      <CrtOverlay enabled={scanlines} />
      {el}
      {career && <CashBadge cash={career.cash} />}
      {activeAchievement && <AchievementToast achievement={activeAchievement} onDismiss={dismissAchievementPopup} />}
    </>
  );

  if (screen === "story") {
    const seed = career ? `${career.car}-${career.month}-${career.wins}-${career.reputation}` : "";
    return withCash(<StorySnippetScreen text={pickSnippetText(storyQueue[0], seed)} onContinue={handleStoryContinue} />);
  }
  if (screen === "intro") return withCash(<IntroScreen onContinue={handleIntroContinue} />);
  if (screen === "title") return withCash(
    <TitleScreen
      hasSave={Boolean(loadCareerSnapshot())}
      onNewGame={() => setScreen("intro")}
      onContinue={continueCareer}
      onCodex={() => { setPrevScreen("title"); setCodexTab("npc"); setScreen("codex"); }}
      scan={scanlines}
      onToggleScan={toggleScanlines}
    />
  );
  if (screen === "newCareer") return withCash(
    <NewCareerScreen meta={meta} onStart={startCareer} playerName={pendingPlayerName ?? career?.playerName ?? "Paul Walker"} />
  );
  if (screen === "careerHome") return withCash(
    <CareerHome
      career={career}
      onRace={() => setScreen("preRaceSetup")}
      onWork={handleWork}
      onMaintain={handleMaintain}
      onShop={() => { setShopActedThisVisit(false); setScreen("shop"); }}
      onJunkyard={handleJunkyard}
      onStreetRace={handleStreetRace}
      onClaimJunkyardCar={handleClaimJunkyardCar}
      onViewCodex={() => { setPrevScreen("careerHome"); setCodexTab("npc"); setScreen("codex"); }}
      onViewAchievements={() => { setPrevScreen("careerHome"); setCodexTab("achievements"); setScreen("codex"); }}
    />
  );
  if (screen === "preRaceSetup") return withCash(
    <PreRaceSetup career={career} onStart={handleStartRace} onBack={() => setScreen("careerHome")} />
  );
  if (screen === "shop") return withCash(
    <ShopScreen
      career={career} meta={meta} onBuyTire={handleBuyTire} onInstallMod={handleInstallMod} onLeave={handleLeaveShop}
      onSellTire={handleSellTire} onSellCar={handleSellCar} onBack={() => setScreen("careerHome")}
      apCharged={shopActedThisVisit}
    />
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
  if (screen === "codex") return withCash(
    <CodexScreen
      meta={meta} career={career} initialTab={codexTab}
      onBack={() => { setNpcEngageResult(null); setScreen(prevScreen); }}
      onEngageNpc={handleEngageNpc} npcEngageResult={npcEngageResult}
    />
  );
  return null;
}
