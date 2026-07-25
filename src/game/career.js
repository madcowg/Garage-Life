// ============================================================================
// CAREER ECONOMY — Work d20 table, race cash/reputation formulas, and the
// unlock-threshold checks. See docs/SEASON1_DESIGN.md for the full design
// (§2 race economy, §8 work economy, §3 unlock rule). Pure functions only —
// no React/localStorage here, that's meta.js and the Career screen state.
// ============================================================================

import { MODS, STAGE1_TIRE_PRICE } from "./data.js";

export const SEASON_LENGTH_MONTHS = 10;
export const AP_PER_MONTH = 3;
export const STARTING_CASH = 300;
// Real autocross events charge a flat entry fee regardless of how you
// finish — same as every car on the grid, win or DNF.
export const ENTRY_FEE = 25;
export const MAINTAIN_COST = 20;
// While unemployed you do the work yourself instead of paying shop labor —
// steep discount, materials only.
export const SELF_MAINTAIN_COST = 5;
export const BASE_SALARY = STAGE1_TIRE_PRICE / 2;

export function rollD20() { return 1 + Math.floor(Math.random() * 20); }
export function rollD10() { return 1 + Math.floor(Math.random() * 10); }

export function createInitialEmployment() {
  return { status: "employed", tenureMonths: 0, baseSalary: BASE_SALARY };
}

export function createNewCareer(car, variant) {
  return {
    car, variant, month: 1, ap: AP_PER_MONTH,
    cash: STARTING_CASH, reputation: 0, lifetimeCashEarned: 0,
    wins: 0, cleanWins: 0, racesEntered: 0,
    wear: { engine: 100, tires: 100, brakes: 100, trans: 100 },
    employment: createInitialEmployment(),
    unlocksEarned: [],
    // Tire purchases are per-career equipment (reset each run, per the
    // roguelike baseline rule) — see TIRE_CATALOG in data.js.
    ownedTires: ["stock"],
    // A mod being in meta.unlockedMods only means Rex will sell it to you —
    // actually bolting it in costs a Shop visit (1 AP). installedMods is
    // per-career (equipment, resets like ownedTires) and, once installed,
    // stays active for the rest of the career — no per-race toggle.
    installedMods: [],
    // Only one sanctioned event runs each month, and a full service is only
    // useful once wear's actually down — both actions cap at once/month so
    // the other 1-2 AP have to go toward Work/Shop/Junkyard/Street Racing.
    racedThisMonth: false,
    maintainedThisMonth: false,
    // Story bookkeeping — see game/story.js. eventsRegistered counts paid
    // entries (incremented at registration, not at finish); storySeen
    // de-dupes the per-career narrative beats so each fires once per run.
    eventsRegistered: 0,
    storySeen: [],
  };
}

// Spends 1 AP for whichever action just resolved; rolls the month over (and
// employment out of "pending") once AP hits 0. Every action (Race, Work,
// Maintain) spends AP only once its outcome is fully determined — Race
// spends it at finish, not at "ROLL OUT", since the action isn't complete
// until the result is known.
export function advanceAfterAction(career) {
  let next = { ...career, ap: career.ap - 1 };
  if (next.ap <= 0) {
    next = { ...next, ap: AP_PER_MONTH, month: next.month + 1, racedThisMonth: false, maintainedThisMonth: false };
    if (next.employment.status === "pending") {
      next.employment = { ...next.employment, status: "employed" };
    }
  }
  return { career: next, seasonEnded: next.month > SEASON_LENGTH_MONTHS };
}

// design doc §8, corrected — the tenure modifier shifts the roll itself
// *before* bucketing (not just the normal-range pay scale), same as a real
// job: seniority protects you from getting canned, it doesn't just pad your
// paycheck. A natural 1 only means "fired" while modifier is 0 (roughly the
// first couple of months) — once modifier reaches 1+, that same nat-1 lands
// on "bad economy" or better instead. This also means bonuses/promotions
// get *more* likely over a long tenure, not just firings less likely — both
// fall out of the same single shift.
export function resolveWork(employment) {
  const rawRoll = rollD20();
  const modifier = Math.floor(employment.tenureMonths / 2);
  const effectiveRoll = rawRoll + modifier;
  const rollInfo = { rawRoll, modifier, effectiveRoll };

  if (effectiveRoll <= 1) {
    return {
      ...rollInfo, cash: 0, event: "fired",
      newEmployment: { ...employment, status: "unemployed", tenureMonths: 0 },
      message: "You were let go this month.",
    };
  }
  if (effectiveRoll === 2) {
    const cash = Math.round(employment.baseSalary * 0.8);
    return {
      ...rollInfo, cash, event: "bad_economy",
      newEmployment: { ...employment, tenureMonths: employment.tenureMonths + 1 },
      message: "Slow month — reduced hours (80% pay).",
    };
  }
  if (effectiveRoll >= 20) {
    const promoRoll = rollD10();
    const bumpPct = promoRoll * 5;
    const newSalary = Math.round(employment.baseSalary * (1 + bumpPct / 100));
    return {
      ...rollInfo, promoRoll, cash: newSalary, event: "promoted",
      newEmployment: { ...employment, baseSalary: newSalary, tenureMonths: employment.tenureMonths + 1 },
      message: `Promoted! Permanent salary +${bumpPct}%.`,
    };
  }
  if (effectiveRoll === 19) {
    const cash = employment.baseSalary * 2;
    return {
      ...rollInfo, cash, event: "bonus",
      newEmployment: { ...employment, tenureMonths: employment.tenureMonths + 1 },
      message: "Bonus! Double pay this month.",
    };
  }
  // Normal range (effectiveRoll 3-18): payout scale still caps at 1.3x —
  // tenure alone can't out-earn an actual promotion.
  const scale = clamp(0.7 + ((effectiveRoll - 3) / 15) * 0.6, 0.7, 1.3);
  const cash = Math.max(1, Math.round(employment.baseSalary * scale));
  return {
    ...rollInfo, cash, event: "normal",
    newEmployment: { ...employment, tenureMonths: employment.tenureMonths + 1 },
    message: "Regular paycheck.",
  };
}

// design doc §8 — while unemployed, spend 1 AP/month attempting to find
// work. Success (>10) means employed starting *next* month; a natural 20
// means employed immediately (same month).
export function resolveJobHunt() {
  const rawRoll = rollD20();
  return { rawRoll, success: rawRoll > 10, instant: rawRoll === 20 };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Junkyard — 1 AP, no cash cost, digging for parts instead of buying them
// retail. Pure upside (worst case is a wasted trip), scaled well below a
// Work paycheck so it's a supplement, not a replacement.
export function resolveJunkyard() {
  const rawRoll = rollD20();
  if (rawRoll <= 6) return { rawRoll, cash: 0, event: "nothing", message: "Picked through two rows of parts cars and came up empty." };
  if (rawRoll <= 14) return { rawRoll, cash: 10 + Math.floor(Math.random() * 16), event: "scrap", message: "Found some usable scrap — resold it for a bit of gas money." };
  if (rawRoll <= 19) return { rawRoll, cash: 30 + Math.floor(Math.random() * 21), event: "solid_find", message: "Solid find — a part in good shape, worth real money." };
  return { rawRoll, cash: 75 + Math.floor(Math.random() * 26), event: "score", message: "Score of a lifetime. Whatever this was, someone's going to want it." };
}

// Street Racing — 1 AP, no entry fee, no reputation (it's off the books).
// Real risk/reward: a bad roll costs cash (fine/tow) and chews tire wear;
// a good roll pays better than a sanctioned event ever could, precisely
// because there's no course, no cones, and no safety margin.
export function resolveStreetRace(tireWear) {
  const rawRoll = rollD20();
  if (rawRoll <= 3) {
    const fine = 20 + Math.floor(Math.random() * 21);
    return { rawRoll, cash: -fine, tireWearDelta: -15, event: "busted", message: `Someone called it in. Paid a ${fine} fine and burned rubber getting out of there.` };
  }
  if (rawRoll <= 9) return { rawRoll, cash: 15 + Math.floor(Math.random() * 16), tireWearDelta: -10, event: "close_one", message: "Close one — made it, but that was closer than it needed to be." };
  if (rawRoll <= 17) return { rawRoll, cash: 40 + Math.floor(Math.random() * 31), tireWearDelta: -5, event: "clean_pass", message: "Clean pass. Nobody around to see it, which is exactly the point." };
  return { rawRoll, cash: 90 + Math.floor(Math.random() * 41), tireWearDelta: 0, event: "untouchable", message: "Untouchable tonight. Best money you've made all month, and nobody's the wiser." };
}

// design doc §2 — race cash/reputation formulas.
export function computeRaceReward({ totalTime, target, conesHit, blindHazardCount }) {
  const secondsUnder = Math.max(0, target - totalTime);
  const bonus = Math.min(100, 20 * secondsUnder);
  const cash = Math.max(10, Math.round(50 + bonus - 10 * conesHit - 5 * blindHazardCount));
  const won = totalTime <= target;
  const cleanWin = won && conesHit === 0;
  const reputation = won ? 10 + (cleanWin ? 5 : 0) : 0;
  return { cash, reputation, won, cleanWin };
}

// design doc §7 — mods unlock permanently once *lifetime* cash earned this
// career crosses each threshold (not current spendable balance).
export function checkModUnlocks(lifetimeCashEarned, unlockedModIds) {
  return MODS.filter(m => lifetimeCashEarned >= m.unlockThreshold && !unlockedModIds.includes(m.id)).map(m => m.id);
}

// design doc §3 — the two concrete MVP car-unlock conditions.
export function checkCarUnlocks({ reputation, wins }, unlockedCarIds) {
  const newlyUnlocked = [];
  if (reputation >= 40 && !unlockedCarIds.includes("hondaCivicSir")) newlyUnlocked.push("hondaCivicSir");
  if (wins >= 3 && !unlockedCarIds.includes("mazdaRx7Fd")) newlyUnlocked.push("mazdaRx7Fd");
  return newlyUnlocked;
}

// design doc §4 — simple weighted season grade (win rate + reputation).
// Return signature (bare S/A/B/C/D letter) is a contract with
// scripts/simulate-season.mjs — don't change it here; autocross-flavored
// framing lives in SEASON_GRADE_LABEL/SEASON_GRADE_STORY_TRIGGER below.
export function computeSeasonGrade({ wins, races, reputation }) {
  const winRate = races > 0 ? wins / races : 0;
  const score = winRate * 60 + Math.min(40, reputation / 2);
  if (score >= 85) return "S";
  if (score >= 70) return "A";
  if (score >= 50) return "B";
  if (score >= 30) return "C";
  return "D";
}

// The season doesn't just stop at a calendar cutoff — it ends because the
// local points chase concludes and standings decide who gets a Nationals
// bid. These map the plain letter grade to that framing for the UI/story
// layer (see SeasonSummaryScreen + story.js season_end_* snippets).
export const SEASON_GRADE_LABEL = {
  S: "NATIONALS BID EARNED", A: "REGIONAL CONTENDER", B: "SOLID POINTS FINISH",
  C: "BUILDING SEASON", D: "REBUILDING YEAR",
};
export const SEASON_GRADE_STORY_TRIGGER = {
  S: "season_end_nationals", A: "season_end_contender", B: "season_end_solid",
  C: "season_end_building", D: "season_end_rebuilding",
};
