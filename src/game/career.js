// ============================================================================
// CAREER ECONOMY — Work d20 table, race cash/reputation formulas, and the
// unlock-threshold checks. See docs/SEASON1_DESIGN.md for the full design
// (§2 race economy, §8 work economy, §3 unlock rule). Pure functions only —
// no React/localStorage here, that's meta.js and the Career screen state.
// ============================================================================

import { MODS, STAGE1_TIRE_PRICE, TIRE_CATALOG } from "./data.js";

export const SEASON_LENGTH_MONTHS = 10;
export const AP_PER_MONTH = 3;
export const STARTING_CASH = 300;
// Real autocross events charge a flat entry fee regardless of how you
// finish — same as every car on the grid, win or DNF.
export const ENTRY_FEE = 25;
export const MAINTAIN_COST = 20;
// Event prep and pre-race checks (PreRaceSetup) used to be pure upside —
// free toggles that only ever helped, so there was no reason not to flip
// every one of them on. Each now costs real cash at registration, same
// commitment point as the entry fee, so skipping one is an actual saving
// against an actual risk (Course Confusion DNF / hazard cards), not a
// no-brainer either way. Tuned to roughly half their original prices —
// full prep (was $55, entry fee alone is $25) undercut a typical race
// payout too badly to ever be worth taking; $30 keeps it a real option,
// not a guaranteed net loss.
export const PREP_COSTS = {
  diagnostics: 5, courseWalk: 10,
  fluids: 5, tires: 5, brakes: 5,
};
// Alternative to paying cash for prep: do all of it yourself for 1 AP
// instead — same trade the DIY Maintain discount already makes (time vs.
// money), just spent as an action instead of a lower price.
export const DIY_PREP_AP_COST = 1;
// While unemployed you do the work yourself instead of paying shop labor —
// steep discount, materials only.
export const SELF_MAINTAIN_COST = 5;
export const BASE_SALARY = STAGE1_TIRE_PRICE / 2;

export function rollD20() { return 1 + Math.floor(Math.random() * 20); }
export function rollD10() { return 1 + Math.floor(Math.random() * 10); }

export function createInitialEmployment() {
  return { status: "employed", tenureMonths: 0, baseSalary: BASE_SALARY };
}

// Starter cash tilts by car, flavor-first: Miata is the baseline, Integra
// gets a cushion (a bit slower off the line, per its stats). The gap is a
// real but modest economic tilt, not a competitive one — simulate-cardgame.mjs's
// win-rate gates don't touch career-layer cash at all, so this can't skew
// race outcomes; it only shifts how many months a player spends cash-strapped
// early on.
export const STARTER_CASH_DELTA = { integra: 100 };

export function createNewCareer(car, variant, playerName = "Paul Walker") {
  return {
    car, variant, playerName, month: 1, ap: AP_PER_MONTH,
    cash: STARTING_CASH + (STARTER_CASH_DELTA[car] ?? 0), reputation: 0, lifetimeCashEarned: 0,
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
    // A nat-20 Junkyard roll finds a locked car sitting in the yard — this
    // holds { carId, expiresMonth } until claimed (pay JUNKYARD_CAR_CLAIM_PRICE)
    // or it expires (advanceAfterAction clears it once the deadline passes).
    junkyardCarOffer: null,
    // Story bookkeeping — see game/story.js. eventsRegistered counts paid
    // entries (incremented at registration, not at finish); storySeen
    // de-dupes the per-career narrative beats so each fires once per run.
    eventsRegistered: 0,
    storySeen: [],
    // Reputation, split in two on top of Points (career.reputation, the
    // cold competitive number that drives the Nationals-bid grade — see
    // SEASON_GRADE_LABEL below, unchanged by this split):
    //   - racingCred: a single "good or bad" driver reputation with the
    //     whole scene — clean wins raise it, DNFs/sloppy runs/getting
    //     busted street racing lower it. Tiers affect the entry fee.
    //   - npcStanding: dating-sim-esque per-character standing with Rex/
    //     Dez/Marisol/Walt, each raised by actions associated with that
    //     character. Tiers unlock character-specific perks (see
    //     NPC_PERK_THRESHOLDS below).
    // Both reset every new career, same roguelike-baseline rule as Points
    // and work tenure — they're this run's social capital, not permanent
    // meta progression.
    racingCred: 0,
    npcStanding: { rex: 0, dez: 0, marisol: 0, walt: 0 },
    // One-time favors unlocked at an NPC's higher standing tier — consumed
    // the next time they'd apply, not re-grantable within the same career.
    dezFreeEntryUsed: false,
    waltFreeMaintainUsed: false,
    // Cars actually owned THIS career (as opposed to meta.unlockedCars,
    // which only makes a car selectable at the START of a future career).
    // The active car (career.car) is always in here; a Junkyard car claim
    // (App.jsx handleClaimJunkyardCar) is the only way today to add a
    // second one — you don't drive it, but you can sell it (App.jsx
    // handleSellCar). everOwnedMultipleCars/carsSoldCount back the two
    // car-selling achievements (Ride or Die / Fire Sale).
    ownedCars: [car],
    everOwnedMultipleCars: false,
    carsSoldCount: 0,
  };
}

// Sell rates for equipment you own but aren't using — a real depreciation
// hit, not a refund. Stock tires never cost anything to begin with, so
// their "sell" price is 10% of the reference Stage 1 Tire price rather
// than 10% of $0; anything actually purchased (extreme_summer/slicks)
// sells at 25% of what it cost.
export const TIRE_SELL_RATE_STOCK = 0.10;
export const TIRE_SELL_RATE_USED = 0.25;
export function tireSellPrice(tireId) {
  const tire = TIRE_CATALOG[tireId];
  if (!tire) return 0;
  if (tireId === "stock") return Math.round(STAGE1_TIRE_PRICE * TIRE_SELL_RATE_STOCK);
  return Math.round(tire.price * TIRE_SELL_RATE_USED);
}

// Flat resale value for a spare car — well under JUNKYARD_CAR_CLAIM_PRICE
// (real depreciation for flipping something you just paid to claim). Every
// extra car today comes from that same claim price, so a single flat value
// is enough; per-car pricing can follow if cars are ever ownable another way.
export const CAR_SELL_PRICE = 150;
// "Before the middle of the season" for the Fire Sale achievement.
export const SEASON_MIDPOINT_MONTH = Math.ceil(SEASON_LENGTH_MONTHS / 2);

// Deducts AP without checking for month rollover — used where the AP has
// to be committed immediately (so an insufficient-AP action can be blocked
// up front) but the actual month/season transition has to wait until the
// action's outcome is known. See checkMonthRollover below.
export function spendAp(career, amount = 1) {
  return { ...career, ap: career.ap - amount };
}

// Rolls the month over (and employment out of "pending") once AP is at or
// below 0, without spending any AP itself.
export function checkMonthRollover(career) {
  if (career.ap > 0) return { career, seasonEnded: career.month > SEASON_LENGTH_MONTHS };
  let next = { ...career, ap: AP_PER_MONTH, month: career.month + 1, racedThisMonth: false, maintainedThisMonth: false };
  if (next.employment.status === "pending") {
    next.employment = { ...next.employment, status: "employed" };
  }
  if (next.junkyardCarOffer && next.month > next.junkyardCarOffer.expiresMonth) {
    next = { ...next, junkyardCarOffer: null };
  }
  return { career: next, seasonEnded: next.month > SEASON_LENGTH_MONTHS };
}

// Spends 1 AP for whichever action just resolved, then rolls the month
// over if that was the last of it. Work/Maintain/Shop/Junkyard/Street
// Racing all resolve instantly, so spend-and-check happen together here.
// Race is the one exception — its AP has to be committed at registration
// (so "can I afford this?" is checked before the race even starts, not
// after), but the month/season transition still can't happen until the
// race actually finishes. See handleStartRace/handleRaceFinish in App.jsx:
// they call spendAp() at registration and checkMonthRollover() at finish
// instead of this combined helper.
export function advanceAfterAction(career) {
  return checkMonthRollover(spendAp(career, 1));
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

// Junkyard — 1 AP, a d20 table with a real downside on a nat-1 (the yard
// still charges you to look around even if you walk out empty-handed).
// 2-18: parts, sold for roll×5 — a bad roll barely covers gas, a good one
// is real money. Nat 19: a Stage 1 mod for a steal (App.jsx picks which
// one, since that needs meta/career state this pure function doesn't
// have). Nat 20: a whole locked car sitting in the yard — App.jsx turns
// this into a time-limited claim offer (JUNKYARD_CAR_CLAIM_PRICE within a
// month).
export const JUNKYARD_FEE = 5;
export const JUNKYARD_UPGRADE_PRICE = 10;
export const JUNKYARD_CAR_CLAIM_PRICE = 300;

export function resolveJunkyard() {
  const rawRoll = rollD20();
  if (rawRoll === 1) return { rawRoll, cash: -JUNKYARD_FEE, event: "yard_fee", message: `Nothing worth grabbing — and the yard still charges a $${JUNKYARD_FEE} look-around fee.` };
  if (rawRoll === 19) return { rawRoll, cash: 0, event: "cheap_upgrade", message: "" };
  if (rawRoll === 20) return { rawRoll, cash: 0, event: "car_find", message: "" };
  return { rawRoll, cash: rawRoll * 5, event: "parts", message: `Found some parts and sold them for $${rawRoll * 5}.` };
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

// design doc §2 — race cash/reputation (Points) formulas. Points is the
// cold competitive number that drives the Nationals-bid grade — unchanged
// by the Racing Cred / NPC Standing split below.
export function computeRaceReward({ totalTime, target, conesHit, blindHazardCount }) {
  const secondsUnder = Math.max(0, target - totalTime);
  const bonus = Math.min(100, 20 * secondsUnder);
  const cash = Math.max(10, Math.round(50 + bonus - 10 * conesHit - 5 * blindHazardCount));
  const won = totalTime <= target;
  const cleanWin = won && conesHit === 0;
  const reputation = won ? 10 + (cleanWin ? 5 : 0) : 0;
  return { cash, reputation, won, cleanWin };
}

// ----------------------------------------------------------------------
// RACING CRED — a single "good or bad" driver reputation, separate from
// Points. Clean wins raise it, DNFs/sloppy runs/getting busted street
// racing lower it. Tiers shift the entry fee — the scene charges known
// troublemakers more and cuts respected regulars a break.
// ----------------------------------------------------------------------
export function computeRacingCredDelta({ dnf, cleanWin, cones }) {
  if (dnf) return -2;
  if (cleanWin) return 2;
  if (cones >= 3) return -1;
  return 0;
}

export const RACING_CRED_TIERS = [
  { max: -6, label: "SKETCHY", entryFeeDelta: 10 },
  { max: 4, label: "UNPROVEN", entryFeeDelta: 0 },
  { max: 14, label: "SOLID", entryFeeDelta: 0 },
  { max: 29, label: "RESPECTED", entryFeeDelta: -5 },
  { max: Infinity, label: "PADDOCK LEGEND", entryFeeDelta: -10 },
];
export function racingCredTier(cred) {
  return RACING_CRED_TIERS.find(t => cred <= t.max);
}
export function effectiveEntryFee(racingCred) {
  return Math.max(10, ENTRY_FEE + racingCredTier(racingCred).entryFeeDelta);
}

// ----------------------------------------------------------------------
// NPC STANDING — dating-sim-esque per-character meters. Each NPC notices
// different things: Rex cares about business (Shop visits), Dez about
// friendliness (any win, more for clean), Marisol about skill (margin of
// victory), Walt about a properly built car (mods installed). Standing
// tiers unlock character-specific perks — see App.jsx for where each is
// actually applied (Rex's tire discount, Marisol/Walt's reduced car-unlock
// thresholds via checkCarUnlocks below, Dez/Walt's one-time favors).
// ----------------------------------------------------------------------
export const NPC_STANDING_THRESHOLDS = { FRIENDLY: 20, TRUSTED: 50 };
export function npcStandingTier(value) {
  if (value >= NPC_STANDING_THRESHOLDS.TRUSTED) return "TRUSTED";
  if (value >= NPC_STANDING_THRESHOLDS.FRIENDLY) return "FRIENDLY";
  return "STRANGER";
}

// Dez (+3 win / +5 clean) and Marisol (+1 win / +4 on a 3s+ margin — she
// respects the gap, not just the result) both move off the same race.
export function computeRaceNpcDeltas({ won, cleanWin, marginSeconds }) {
  if (!won) return { dez: 0, marisol: 0 };
  return { dez: cleanWin ? 5 : 3, marisol: marginSeconds >= 3 ? 4 : 1 };
}

// Rex's tire discount — the more business you give the shop, the better
// the price gets.
export function rexTireDiscount(rexStanding) {
  if (rexStanding >= NPC_STANDING_THRESHOLDS.TRUSTED) return 0.2;
  if (rexStanding >= NPC_STANDING_THRESHOLDS.FRIENDLY) return 0.1;
  return 0;
}
export function discountedTirePrice(basePrice, rexStanding) {
  return Math.max(0, Math.round(basePrice * (1 - rexTireDiscount(rexStanding))));
}

// design doc §7 — mods unlock permanently once *lifetime* cash earned this
// career crosses each threshold (not current spendable balance).
export function checkModUnlocks(lifetimeCashEarned, unlockedModIds) {
  return MODS.filter(m => lifetimeCashEarned >= m.unlockThreshold && !unlockedModIds.includes(m.id)).map(m => m.id);
}

// design doc §3 — the two concrete MVP car-unlock conditions. Marisol and
// Walt's standing can lower the bar — the whole point of "inaccessible
// vehicles" being an NPC-standing perk (a word put in on your behalf
// counts for something).
export function checkCarUnlocks({ reputation, wins }, npcStanding, unlockedCarIds) {
  const newlyUnlocked = [];
  const marisol = npcStanding?.marisol ?? 0;
  const walt = npcStanding?.walt ?? 0;
  const sirThreshold = marisol >= NPC_STANDING_THRESHOLDS.TRUSTED ? 20 : marisol >= NPC_STANDING_THRESHOLDS.FRIENDLY ? 30 : 40;
  const rx7Threshold = walt >= NPC_STANDING_THRESHOLDS.TRUSTED ? 1 : walt >= NPC_STANDING_THRESHOLDS.FRIENDLY ? 2 : 3;
  if (reputation >= sirThreshold && !unlockedCarIds.includes("hondaCivicSir")) newlyUnlocked.push("hondaCivicSir");
  if (wins >= rx7Threshold && !unlockedCarIds.includes("mazdaRx7Fd")) newlyUnlocked.push("mazdaRx7Fd");
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
