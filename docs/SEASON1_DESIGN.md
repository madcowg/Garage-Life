# Season 1 Career Loop — Design

*Finalized design, agreed in discussion before implementation began (see git history around this file's introduction for the conversation this came from). This is the reference for the Career/Season layer being built on top of the existing autocross card-game core.*

---

## 0. What this is and isn't

This covers **one season** (Season 1 of an eventual 10), built calendar/Action-Point style, with the meta-unlock layer wired in from the start so the roguelike rule is real from day one, not bolted on later.

**Explicitly out of scope for this pass:**
- Seasons 2–10 (structure will be identical, just re-run — the "scale to 10" step should be close to free once Season 1 is right)
- Other event types (street/drift/drag/track/endurance) — autocross only, per the GDD's own sequencing ("best place to learn the card game")
- Tiered parts beyond Stage 1 (Stage 2/3, Junkyard, Legendary, etc.) — Stage 1 only for MVP (§7)
- Liveries/cosmetic customization
- Achievements — a separate, later system, distinct from the unlock catalog
- Any of the "share with others" social/Steam features — but the Career Summary data (§6) is shaped so that's addable later without a rewrite

---

## 1. Calendar structure

- **1 season = 10 months.** (A real autocross season runs ~10-11 months; weekly cadence would make a single season ~50 turns, too long for an MVP loop.)
- **Each month, the player has 3 Action Points (AP)** to spend before advancing to the next month. Also maps well onto reality — most autocrossers run 1-2 events a month, not one a week.
- Months advance automatically once all 3 AP are spent. AP must be fully spent each month — no banking.

### Actions (each costs AP unless noted)

| Action | AP cost | Effect |
|---|---|---|
| **Race** | 1 | Enter an autocross event (existing course-gen + dice flow — see §9 for the dice rework). Earns Cash + Reputation based on result (§2). Applies wear — persists across months, only reset by Maintain (§5). |
| **Work** | 1 | Work your day job — full d20 economy, see §8. |
| **Maintain** | 1 | Full service — restores wear (engine/tires/brakes/trans) toward 100%. $20, or $5 self-service while unemployed (DIY labor, no shop rate). |
| **Shop** (buy mods/tires/gauges/cars) | **Free, anytime** | Not a time-cost action — gated by Cash and by whether the item is unlocked, not by AP. |

10 months × 3 AP = 30 total actions per season — realistically nets somewhere around 15-20 races once Work/Maintain are mixed in, in the right neighborhood for a real regional autocross season's event count.

---

## 2. Race economy — Cash & Reputation

*(Validated via scripts/simulate-season.mjs and scripts/tune-target-buffer.mjs — see §9 for the target-time buffer that came out of this.)*

**Cash per race:**
```
cash = 50 (base)
     + 2 × (secondsUnderTarget × 10), capped at +100
     − 10 × conesHit
     − 5 × blindHazardsSuffered
minimum 10 (you always get something for finishing)
```

**Reputation per race:**
```
reputation = 0 if you didn't beat target
reputation = 10 if you beat target (a "win")
           + 5 bonus if zero cones hit ("clean win")
```

**Maintain cost:** $20, restores all 4 wear stats to 100%. $5 self-service instead while unemployed (DIY labor, no shop rate) — see §8.

**Starting cash for a new career: $300.** A real stake, not $0 — enough to survive a rough first race or two, or buy into Stage 1 Engine early.

*(Work income is its own system — see §8, not a flat number.)*

**Simulated result** (300 seasons × 3 play strategies, see §9): win rate lands ~39-44% averaged across a whole season (stock-car races early in a season are harder, pulling the average down from the ~50% steady-state rate once fully Stage-1 built) — grade distribution mostly B/A rather than the D-heavy result before tuning.

---

## 3. The roguelike unlock rule

- Meta-unlocks are **immediate**: the moment you hit an unlock condition, that item enters the catalog and is purchasable for the *rest of the current career*, not just future ones.
- Meta-unlocks **persist forever** in `localStorage`, across every future career.
- A new career **always starts from the same baseline** regardless of what's unlocked: $300 starting cash, same starting car choice (from *starters*), **zero reputation** (resets every career), zero wear damage, **zero work tenure** (§8 — a fresh job at fresh seniority every time, same logic as reputation). Unlocks only ever expand *what you can buy*, never *how strong you start*.
- **Achievements are a separate, later system** (post-MVP). The `careerHistory` log in §5/§6 still gets built now since the unlock conditions and season summary need it regardless.

### Concrete unlock conditions for this MVP

| Unlock | Condition |
|---|---|
| Honda Civic SiR | Reach Reputation ≥ 40 in a season |
| Mazda RX-7 FD | Win 3 races in a season |

The other 6 JDM cars get unlock conditions once this loop is validated.

---

## 4. Season-end flow

At the end of month 10:
- **Season Summary screen**: total cash earned, total reputation, races entered/won/lost, final wear state, employment status, a **Season Grade** (S/A/B/C/D) from a simple weighted formula (win rate + total reputation).
- Any unlock conditions met during the season are already live (§3) — summary just recaps what got unlocked and when.
- **Career Complete** (this is a 1-season MVP): archive this run into Career History (§6), then offer "New Career" — fresh baseline, expanded catalog.

---

## 5. State/architecture

- **New top-level screen layer**: `Career` sits above the existing Setup → Race → Results flow. Setup/Race/Results become *what happens when you spend a Race action*, not the whole game.
- **New `CareerHome` screen**: month counter (n/10), Cash, Reputation, employment status, car condition, the 3 action buttons, and a Shop entry point.
- **Wear persists across months** — only reset by Maintain, not by every race.
- **New persistent state** (`localStorage`):
  - `garageLifeMeta`: `{ unlockedCars: [...], unlockedMods: [...], careerHistory: [...] }`
  - `careerHistory` entries: `{ seasonGrade, finalCar, totalCash, totalReputation, wins, losses, completedAt }`
- **New per-career state** (resets each new career): `month`, `cash`, `reputation`, `lifetimeCashEarned` (cumulative, drives mod unlocks — distinct from spendable `cash`), `ownedCars`, `wear`, `employment: { status, tenureMonths, baseSalary }`.

---

## 6. Career Summary data shape (future-proofing for "share with others")

```js
{
  seasonGrade: "A",
  car: { id: "miata", variant: "NA" },
  totalCash: 640,
  totalReputation: 55,
  races: { entered: 9, won: 6, cleanWins: 3 },
  unlocksEarned: ["hondaCivicSir"],
  completedAt: 1234567890
}
```

---

## 7. Mods & progression (Stage 1 only for MVP)

Full replacement of the old 5-mod list (Tuned Coilovers, LSD, Sway Bars, Brake Upgrade, Turbo) — retired entirely.

**Available from day one** (no unlock needed): **Stage 1 Tires** ($100 — sets base salary, §8), **Maintenance**. Same mechanics as today, just the tire tier is now explicitly "Stage 1."

**Unlocked by *cumulative lifetime cash earned* this career** (not current balance — earning and spending doesn't un-unlock anything):

| Threshold | Mod | Real part | Mechanical effect |
|---|---|---|---|
| $100 | Stage 1 Engine | Filter + catback exhaust | Mild power bonus on power segments (Launch/Sweeper/Finish) — no stress-risk downside, unlike the old Turbo, since a filter+exhaust genuinely doesn't add meaningful mechanical risk in reality |
| $200 | Stage 1 Brakes | Race pads + braided lines | Grants **advantage** (roll twice, keep better) on "brake" category rolls — see §9 |
| $300 | Stage 1 Suspension | Anti-sway bars | Grants **advantage** on "mistake" category rolls — see §9 |
| $400 | Stage 1 Safety | Race seat + harness | Flat **+1 to every roll**, regardless of category — a more planted driver rolls better across the board |

Player chooses which unlocked mods to actually install each race (existing toggle UI, unchanged) — unlocking isn't the same as equipping.

**Known gap, not fixing now**: the old Transmission-stress category (previously mitigated by LSD) has no dedicated mod in this list. Leaving it alone for MVP — it still responds to the maintenance modifier (§9) and car stats, just no specific mod counters it yet.

---

## 8. Work economy

**Stage 1 Tires = $100. Base salary = $50/month.**

**Each Work action rolls a d20, then adds a tenure modifier to the roll *before* bucketing the outcome** — not just to scale the normal-pay range. This is the corrected version of the mechanic (an earlier draft checked the raw roll for fired/bad-economy/bonus/promoted and only applied tenure to pay-scaling — that made firing a flat 5% forever, which isn't how a real job works: seniority should protect you from getting canned, not just pad your paycheck):

| Effective roll (raw + tenure modifier) | Outcome |
|---|---|
| ≤1 | **Fired.** No income this action. Next month, spend 1 AP on "Look for Work": roll d20, need >10 to be hired (can Work again the *following* month); rolling a natural 20 on that job-hunt roll gets you hired immediately, same month. Retry every month (1 AP each attempt) until successful. |
| 2 | **Bad economy** — reduced hours, 80% of current base pay. |
| ≥20 | **Promoted** — permanent base salary increase. Roll a d10: permanent **+5% per point** bump to base salary. |
| 19 | **Bonus** — a one-time extra payout on top of normal pay (double pay that month). |
| 3-18 | Normal pay, scaled 0.7x-1.3x by where the effective roll falls in this range. |

**Tenure modifier**: `floor(tenureMonths / 2)`, added to the raw roll before the bucket check above. Resets to 0 if fired, and resets every new career (matches reputation's reset rule — a fresh job at fresh seniority each run). Separate modifier pool from the race-dice modifiers in §9 — same "modifier on a roll" *pattern*, different subsystem, not a shared number.

Practical effect: a natural 1 only means "fired" while the modifier is still 0 (roughly the first couple of months of continuous employment) — once modifier reaches 1+, that same nat-1 becomes "bad economy" or better instead. The same shift also makes bonuses/promotions *more* likely the longer you've held a job, not just firing less likely — both fall out of the single modifier. Confirmed via simulation: fired-by-month histograms cluster overwhelmingly in months 1-2, essentially never later in a season of continuous employment.

**Self-service Maintain**: while unemployed, Maintain costs $5 instead of $20 — no job means more free time to do it yourself instead of paying shop labor.

---

## 9. Race dice & randomness rework

The old dice mechanic was flagged as too random. This fix keeps the "visible, honest dice" pillar intact — the die shown on screen is still what determines the outcome — while making the *build* matter more within a hazard, not just which hazard shows up.

### The actual problem (before this rework)

1. **Category selection** (`outcomeWeights`) — mods/wear/maintenance already shift *which* hazard category you're likely to land in. This part works and stays as-is.
2. **Severity roll** (`resolveOutcome` → `rollD6` → `penaltyFromRoll`) — once in a category, severity was a flat unmodified 1-6 roll. Worse: a couple of mods used to shave a flat amount off the penalty *after* the roll, invisibly — the die on screen said "rolled a 2" but the real result was quietly improved behind it. That was dishonest relative to the "make the probability math visible" pillar this project is built on, not just "too random."

### The fix — two visible, build-driven modifiers on the roll itself

**A. Maintenance modifier.** For whichever wear stat is relevant to the category being resolved:
- wear ≥ 70% → **+1** to the roll
- wear 30-69% → no modifier
- wear < 30% → **−1** to the roll

**B. Mod-granted advantage (roll twice, keep the better):**
- Stage 1 Suspension → advantage on **mistake** rolls
- Stage 1 Brakes → advantage on **brake** rolls
- Stage 1 Engine grants **no** advantage anywhere — pure power mod, no safety benefit, matching real filter+exhaust
- (No mod currently covers **trans** — known gap, §7)

**C. Stage 1 Safety's flat +1 to every roll** stacks on top of A and B — it's a separate, universal modifier, not category-specific.

All of this is shown on screen — "rolled 2, +1 maintenance, +1 Safety → 4" or "rolled 2 and 5 (Suspension advantage) → kept 5, +1 Safety → 6" — instead of hidden math. The old invisible post-roll mitigations (tire-compound, old brake-upgrade) are removed — they'd double-count with this system otherwise.

This needed a headless simulation pass (win-rate distribution across build quality) before it went anywhere near the UI — same discipline as the original car-corner-multiplier fix.

### Target-time buffer, tuned to a 50% win-rate goal

The user set an explicit target: an average player should win ~50% of races, or the game reads as too hard to bother with. `scripts/tune-target-buffer.mjs` tested `computeTarget`'s buffer against a fully Stage-1-modded, mid-aggression-decision car (the "steady state" build for most of a season) across several values. `1.30` lands at ~50% at the *original* segment-time scale, with a stock (unmodded) car at ~20% — that gap is the intended difficulty curve, the season's own mod progression makes the car (and the odds) better over time.

**Segment times were later rescaled 3x** (real autocross runs ~30-45s, not the original 10-15s) — hazard penalties stayed fixed in absolute seconds, so at the larger time scale they're a smaller fraction of a run, which is deliberate (more room to recover from a single mistake, same as real autocross). That changed the win-rate curve, so the buffer was re-tuned at the new scale: **1.24** now gives ~50% for a fully-built car. Both tunings are preserved here so future rebalancing knows *why* the number is what it is, not just what it is.

---

## 10. Build order

1. Lift wear + add cash/reputation/month/employment state into a new `Career` layer wrapping the existing screens.
2. Build `CareerHome` screen (month counter, AP buttons, resource display).
3. Wire Race action → existing RaceScreen → cash/rep awarded on return.
4. Build the Work economy (§8): d20 roll, raw-roll special cases, tenure modifier, fired/job-hunt flow.
5. Wire the Maintain action.
6. Build Season Summary + Career Complete screens.
7. Wire meta-unlock persistence (`localStorage`) + the 2 concrete car-unlock conditions + the 4 cash-milestone mod unlocks.
8. Rework the dice mechanic per §9 (maintenance modifier + mod advantage + Safety's flat +1, remove old hidden mitigations), update DiceWidget to show all of it transparently.
9. Update Setup/Shop screens: new Stage 1 mod list, unlocked-but-not-yet-owned cars become purchasable.
10. Headless-simulate a full season — race economy (§2), Work economy (§8), and the reworked dice (§9) together — before trusting any of these numbers.
