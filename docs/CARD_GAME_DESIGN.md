# Race Core — "The Deck IS the Car" (as shipped)

*Supersedes the original v1 proposal below this line's history. Describes what
`packages/card-core-v2/` (headless engine) + `src/game/v2.js` (career-state
adapter) actually implement today, not the original pitch — the engine
evolved further during the "v2 rewrite" and several v1 mechanics changed
shape or were replaced outright. Canonical visual spec is
`docs/DESIGN_LANGUAGE.dc.html` (tokens: `--gl-*` in `src/index.css`) —
not duplicated here.*

## 1. Core loop

A race = **7 segments**: a fixed Start (par 4.8s) → 5 randomly chosen and
ordered elements from a 6-element pool → a fixed Finish Gate (par 4.4s).
Per segment:

1. **Refill** hand to hand size (flat 4 — no mod currently grants a bonus,
   see §16) from the draw pile.
2. **Play exactly one Line card** (Technique or Aggression) — falls back to
   the always-available *Safe Line* (+0.6s, +2 control) if none is chosen,
   so a hand can never brick.
3. **Optionally play one Utility card** before the Line card (or discard an
   Unsettled card as that slot instead).
4. Resolve deterministically — see §7 for the full segment-time formula.
   Wear costs drain immediately.
5. Played cards → discard. Draw pile empty → reshuffle discard.

## 2. Card anatomy

`Name · Type · Affinity · Time delta · Control · Wear cost · Text`

Every playable card also carries a **control** number (can be negative) —
this is new versus the v1 proposal, see §9.

- **Technique** (teal) — deterministic time saves, modest wear, usually
  positive control.
- **Aggression** (pink) — bigger time saves, negative control, adds 1
  Unsettled to hand and breaks Flow.
- **Utility** (gold) — draw/discard/recovery effects.
- **Hazard** (red) — injected by skipped maintenance/low wear. Not playable;
  fires automatically from hand when its segment tags match.
- **Strain** — internal type name only; the single card of this type is
  named and flavored **Unsettled** (see §10). "Strain" as a plural card
  family from the v1 doc doesn't exist in the shipped engine.

## 3. Deck construction — fixed-14, replacement-based

**The deck is always exactly 14 cards.** `buildCompetitiveDeck()` throws if
it isn't. Vehicle identity, tires, and mods all work by **1:1 replacement**
— remove a specific card id (or first match from a candidate list), add one
new card — never by adding cards on top. The v1 doc's "stock ≈14, fully
built ≈19–21" growth framing does not describe the shipped engine.

| Source | Effect |
|---|---|
| **Vehicle** (`vehicles.js`) | Replaces 1–2 base cards with identity cards |
| **Tire** (`mods.js`) | Replaces 0–3 base cards (Racing Compound/Slicks only) + passives |
| **Stage 1 mods** (`mods.js`) | Replaces 0–1 base cards each + passives |
| **Maintenance/wear** (pre-race) | Injects hazard cards into the hand pool alongside the 14 (§13), doesn't touch deck size |

## 4. Base Autocross Deck (14 cards, always present before replacements)

| Qty | Card | Type | Affinity | Time | Control | Wear | Text |
|---|---|---|---|---|---|---|---|
| 2 | Smooth Inputs | Technique | Any | −0.7s | +2 | — | Builds Flow on a clean on-affinity segment |
| 2 | Threshold Brake | Technique | Braking, Tight | −1.25s | +1 | brakes 2, tires 1 | |
| 2 | Balance Throttle | Technique | Flowing, Transition | −1.15s | +1 | tires 1 | |
| 2 | Rotate and Exit | Technique | Tight, Braking | −1.25s | +1 | brakes 1, tires 1 | |
| 1 | Clean Launch | Technique | Start, Power | −1.05s | +1 | trans 1, tires 1 | |
| 1 | Straighten the Course | Technique | Transition, Precision, Complex | −1.2s | +2 | tires 1 | |
| 1 | Late Brake | **Aggression** | Braking, Tight | −1.9s | −1 | brakes 4, tires 1 | Adds 1 Unsettled, breaks Flow |
| 1 | Carry Entry Speed | **Aggression** | Flowing, Transition, Precision | −1.85s | −1 | tires 3 | Adds 1 Unsettled, breaks Flow |
| 2 | Eyes Up | Utility (pre-line) | — | — | — | — | Draw 2, discard 1 |

Not in the 14-card deck but always playable as a fallback: **Safe Line**
(Technique, any, +0.6s, +2 control).

Defined in `cards.js` but **not part of `BASE_AUTOCROSS_DECK` and not wired
to any vehicle/mod replacement** — a real, currently-unused card, see §16:
**Full Send Launch** (Aggression, Start/Power, −1.7s, −1 control, wear
engine 3/trans 3/tires 1, adds Unsettled, breaks Flow).

## 5. Vehicle identity (1:1 replacement)

| Vehicle | Replaces | With | Handling profile | Target offset |
|---|---|---|---|---|
| Miata NB | 1× Clean Launch, 1× Smooth Inputs | 2× **Momentum Dance** (Technique, Tight/Flowing/Transition, −1.4s, +2 control, wear tires 1) | transitionBonus +0.08 (best in roster) | 12.72 |
| Integra GS-R | 1× Clean Launch → **VTEC Window** (Technique, Power/Flowing/Finish, −1.4s, +1 control, wear engine 2); 1× Smooth Inputs → **Neutral Balance** (Technique, any, −0.85s, +2 control) | — | flat (all 0) | 11.04 (easiest of the starters) |
| Corvette C6 | 1× Balance Throttle, 1× Rotate and Exit | 2× **Big Power** (Technique, Start/Power/Finish/Flowing, −1.6s, 0 control, wear tires 2/engine 1) | powerBonus +0.1, transitionBonus −0.06 | 11.82 |
| **beater_van** "The Titty Twister" (secret/unlockable joke car) | 1× Smooth Inputs | **Cheat Code** (see §11) | powerBonus −0.08, transitionBonus +0.04 | 10.2 |

Also in the roster with full handling/offset data but no unique cards yet
(`replacements: []`): **unlockable** Toyota Supra Mk4, Nissan Skyline GT-R
R34, Mazda RX-7 FD, Mitsubishi Evo VI, Honda NSX (NA1); **planned**
(not yet playable) Nissan 180SX, Honda Civic SiR, Subaru Impreza WRX, Honda
S2000, and a future BMW Legends tier (E36/E46/E39/E90).

## 6. Tires (1:1 replacement + passives)

| Tire | Replaces | Passive |
|---|---|---|
| All-Season | none | `tireWearFlatAdd +1`; `controlPenaltyOnPrecision 1` (control-margin penalty on Precision-tagged segments only) |
| Street Performance | none (baseline) | — |
| Racing Compound | 1× Eyes Up, 1× of [Smooth Inputs/Neutral Balance/Rotate and Exit] → 2× **Grip Window** | `postEventTireWear +5`, `firstRunColdTireTimePenalty 0.15` (run 1 only) |
| Slicks | both Eyes Up + 1× of the same trio → 3× **Grip Window** | `postEventTireWear +12`, `firstRunColdTireTimePenalty 0.35` |

**Grip Window** (Utility, pre-line): next Line card −0.1s and half tire wear; draw 1, discard 1.

## 7. Stage 1 mods (1:1 replacement + passives)

| Mod | Replaces | Passive |
|---|---|---|
| Stage 1 Engine | 1× of [Clean Launch/Smooth Inputs/Neutral Balance] → **Breathe** (Technique, Start/Power/Finish, −1.2s, +1 control, wear engine 1) | — |
| Stage 1 Brakes ("Pads and Lines") | Threshold Brake → **Upgraded Threshold** (Technique, Braking/Tight, −1.35s, +2 control, wear brakes 1/tires 1) | `brakeHazardTimeMultiplier 0.75` — brake hazards do 75% of listed time penalty, not the 50% the v1 doc claimed |
| Stage 1 Suspension ("Sway Bars") | 1× of [Balance Throttle/Smooth Inputs/Neutral Balance] → **Set the Platform** (Technique, Transition/Flowing/Precision, −1.25s, +2 control, wear tires 1, keeps Flow alive through a hazard this segment) | — |
| Driver Fit (Seat/Pedals/Restraint) | none | `startingMulligans +1` (free hand swap at run start); `safetyRating +1` — **tracked but not consumed by anything yet**, see §16. Not called "Safety" in code, and does **not** grant hand size 5 (no mod does — see §16) |
| Basic Diagnostics | none | `revealHazardSystems: true` — the single collapsed pre-race gauge (exact hazard counts by system) confirmed intentional elsewhere in this repo's docs |

## 8. Course generation

Fixed pool of 6 elements (`disciplines.js`), 5 chosen at random each race
(unweighted — forcing selection broke the balance-sim acceptance gates) and
ordered so the segment before Finish is never Tight/Braking-tagged and no
two Complex-tagged elements land back-to-back:

| Element | Par | Precision | Tags |
|---|---|---|---|
| Slalom | 6.8s | 2 | Transition, Precision, Complex |
| Offset Gates | 6.2s | 2 | Transition, Precision |
| Sweeper | 7.1s | 1 | Flowing, Power |
| Turnaround | 7.8s | 2 | Braking, Tight, Complex |
| Chicago Box | 7.0s | 3 | Braking, Transition, Precision, Complex |
| Decreasing Radius | 7.4s | 2 | Braking, Tight, Complex |

`precision` feeds directly into the control-margin math (§9), a per-segment
stat the v1 doc never had.

## 9. Affinity, control margin & cones

- **Affinity**: on-affinity Line card gets full time delta; off-affinity
  gets **×0.66** effect (not the v1 doc's ×0.5) and **×1.25** wear cost.
- **Control margin** (`controlOutcome()`, new mechanic, replaces the v1
  doc's "Tire Delamination" hazard as the sole cone source):
  `margin = card.control + vehicle.handlingProfile.controlBonus + (1 if Flow active) + (1 if on-affinity) − segment.precision − hazardControlPenalty − tirePenalty`
  (`tirePenalty` = All-Season's `controlPenaltyOnPrecision`, Precision segments only.)
  | Margin | Result |
  |---|---|
  | ≤ −6 | DNF (off-course) |
  | ≤ −4 | 2 cones |
  | ≤ −2 | 1 cone |
  | else | 0 cones |
  Cone penalty: **1.7s each** (`CONE_PENALTY_SECONDS`), applied on *every*
  segment resolution via this formula — not tied to any specific hazard card.

## 10. Flow (formerly "Momentum")

`state.flow`, max 1. Grants **−0.3s** (`FLOW_TIME_BONUS`) to the *current*
segment's time and +1 to that segment's control margin while active — the
v1 doc's "next segment" phrasing was wrong, it's the segment Flow is already
active going into.

- **Gain**: a clean Technique play (on-affinity, zero cones, no hazard
  fired) sets Flow to max.
- **Loss**: any Aggression play, any `breaksFlow` card, or any cones this
  segment zero it immediately (checked first). A fired hazard also zeroes
  it unless the played card has `protectFlowFromHazard` (only **Set the
  Platform**, Stage 1 Suspension, has this).

## 11. Unsettled (formerly "Strain")

One card, `id: 'unsettled'`, added to hand by an Aggression card's
`addStrainToHand` effect (not drawn). Checked at the *start* of each
segment based on copies currently in hand:

| Copies in hand | Time penalty |
|---|---|
| 0 | +0s |
| 1 | +0.2s |
| 2 | +0.6s |
| 3 | +1.2s |
| 4+ | +1.2s + 0.8s per copy beyond 3 |

Can be discarded as that segment's Utility play; the engine auto-discards
Unsettled first if no explicit discard choice is given.

## 12. Hazards

Injected pre-race, fire automatically the first time a matching segment's
tags come up while the hazard sits in hand, then discard.

| Hazard | System | Fires on | Effect |
|---|---|---|---|
| Long Pedal | brakes | Braking, Tight | +1.3s, +1 control penalty, wear brakes 3 |
| Grip Mismatch | tires | Tight, Flowing, Transition, Precision | +1.1s, +1 control penalty, wear tires 3 |
| Heat Soak | engine | Power, Start, Finish | +1.0s (×0.55 `thermalHazardScale` for autocross ⇒ ~0.55s effective), wear engine 3 |
| Missed Shift | transmission | Start, Power, Transition | +1.2s, +1 control penalty, wear trans 3 |
| Course Confusion | course-notes | Complex only | **Instant run DNF** if no Course Note token remains (tokens from course walks: `courseWalks − 1`, min 0) — no time-penalty math, just a DNF |

**Injection rule** (`buildHazardDeck`): skipping a system's pre-race
maintenance check injects 2 copies of that system's hazard. Independently,
wear <30% injects 2 copies, wear 30–49% injects 1 (stacks with the skip
penalty). Skipping the course walk injects 2× Course Confusion. No mod
currently reduces transmission-hazard severity — a known gap (§16).

## 13. Wear scaling

Every card/hazard authors its wear cost in flavor units; `SYSTEM_WEAR_RATE`
scales the *aggregate* down to match autocross's real profile: tires 1.0
(baseline), brakes 0.2, engine 0.1, transmission 0.05.

## 14. Cheat Code / secret car

`Cheat Code` (Technique, any affinity, −2.3s, +5 control,
`bypassSegment: true`) is the **beater_van's** one identity-replacement
card (§5) — not unused. When played: segment time = par + the card's own
delta, full stop — no affinity check, no cones, no hazard time/control
penalty, no Unsettled penalty, no wear, no vehicle adjustment, no cold-tire
penalty, and it maxes Flow. It cannot undo a same-segment Course Confusion
DNF (that resolves before any Line card is chosen). Confirmed 97%+ win rate
once beater_van is unlocked — **intentionally overpowered, the deliberate
payoff for unlocking a joke secret car, not a balance bug** (decided
2026-07-29, see README's known-simplifications section).

## 15. Target time & validation

`getAutocrossTargetTime = Σ(that run's 7 segment pars) − vehicle.autocrossTargetOffset`.
The offset *is* the tuned buffer, baked per-vehicle (e.g. Miata 12.72,
Integra 11.04, Corvette 11.82) — not a global buffer constant applied to a
"best-case play" baseline like the v1 doc described.

Current measured results (`packages/card-core-v2/scripts/simulate-cardgame.mjs`,
re-verified 2026-07-29 — 15/15 unit tests and all 12 acceptance gates pass):

| Build | Bot | Win rate | Target band |
|---|---|---|---|
| Built (all Stage 1 + Racing Compound) | affinity | 54–60% across the 3 starters | 40–60% |
| Stock | affinity | 19–20% | 10–30% |
| Built | random | ≤2.1% | ≤10% |
| Built | aggression | always loses to affinity | must lose |

## 16. Known gaps (honest, not proposals)

- **Full Send Launch** (§4) is fully defined in `cards.js` but not part of
  the base deck or any vehicle/mod replacement — dead content.
- **No mod reduces transmission-hazard severity** — Brakes has
  `brakeHazardTimeMultiplier`, nothing analogous exists for Missed Shift.
- **Driver Fit's `safetyRating +1`** is tracked in the passive object but
  not consumed by any other system currently.
- **`handSizeBonus`** is valid plumbing in the passive-merge logic
  (`deckBuilder.js`) but no vehicle/tire/mod currently sets it — hand size
  is a flat 4 for every build today, despite the v1 doc's "Safety mod grants
  hand size 5" claim.

## 17. Career integration (unchanged)

Cash/reputation formulas, unlock conditions, work economy, and season
structure are untouched by the card-engine rewrite — see
`docs/SEASON1_DESIGN.md` §2/§8, re-verified against `career.js` 2026-07-29
with no discrepancies found.
