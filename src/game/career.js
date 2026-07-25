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
    next = { ...next, ap: AP_PER_MONTH, month: next.month + 1 };
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
export function computeSeasonGrade({ wins, races, reputation }) {
  const winRate = races > 0 ? wins / races : 0;
  const score = winRate * 60 + Math.min(40, reputation / 2);
  if (score >= 85) return "S";
  if (score >= 70) return "A";
  if (score >= 50) return "B";
  if (score >= 30) return "C";
  return "D";
}
