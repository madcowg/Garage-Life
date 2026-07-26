# Race Core Redesign — "The Deck IS the Car"

*Replaces the aggression-buttons + hidden-weights + d6 system. Every number here is a
starting point to be validated by headless simulation before shipping, same discipline
as every prior balance pass.*

---

## 0. Consequence audit — what dies

Per the rule "anything without consequence shouldn't exist":

| Current mechanic | Verdict | Replacement |
|---|---|---|
| 3-way aggression buttons | **Cut** | Card hand (the choice becomes *which card*, *when*) |
| Hidden `outcomeWeights` category RNG | **Cut** | Deck composition — same probabilities, but visible and player-built |
| d6 severity on every action | **Cut** (see §7 for its one surviving use) | Deterministic card effects |
| Reveal screen (watch the die) | **Cut** | Card play → immediate resolution, next draw |
| Gauges reducing invisible penalties | **Rework** | Gauges reveal hazard cards (see §7) |
| Tire compound flat bonuses | **Rework** | Tires add/change cards in the deck |
| Maintenance checklist weight shifts | **Rework** | Skipped items inject *visible* hazard cards |
| Segment "driving questions" | **Keep** | Becomes card affinity system |
| Wear pools, career economy, target time | **Keep** | Card costs drain wear; economy unchanged |

## 1. Core loop

A race = 6 segments (unchanged). Per segment:

1. **Refill** hand to hand size (4; 5 with Stage 1 Safety) from the draw pile.
2. **Play exactly one Line card** (Technique or Aggression) — this is how you drive the segment.
3. **Optionally play one Utility card** before or after the Line card.
4. Resolve deterministically: segment time = par + card delta (halved if off-affinity) + momentum + hazards. Costs drain wear pools immediately.
5. Played cards → discard. **Unplayed cards stay in hand** — holding the Trail Brake for the hairpin two segments away is the core tension.

Draw pile empty → reshuffle discard (Strain cards included — abuse follows you).

## 2. Card anatomy

`Name · Type · Affinity icons · Time delta · Wear cost · Text`

Types (frame color, vaporwave palette):
- **Technique** (teal) — deterministic time saves, modest costs.
- **Aggression** (pink) — big saves, heavy wear, injects Strain.
- **Utility** (gold) — draw, scry, recovery, Strain removal.
- **Hazard** (red) — injected by neglect/wear. Not playable; fires from hand (§7).
- **Strain** (gray) — dead cards from aggressive play. Clog hands.

## 3. Deck construction — the garage is the deckbuilder

| Source | Contribution |
|---|---|
| **Chassis** (car model) | 14-card base skeleton, mix shaped by car identity (§4b) |
| **Tires** | 0–2 grip cards + wear-rate consequences (§4c) |
| **Mods** (Stage 1) | +1–2 cards each, or passive (Safety = hand size 5) (§4d) |
| **Maintenance** | Each skipped checklist item injects 2 hazard cards; each wear pool <50% injects 1 (§7) |
| **In-race wear** | Aggression cards inject Strain into the draw pile mid-race |

Stock deck ≈ 14 cards; fully built ≈ 19–21. Six segments cycle the deck roughly once.

## 4. Complete card list (v1)

### 4a. Base skeleton (every car, 14 cards)

| Qty | Card | Type | Affinity | Time | Cost | Text |
|---|---|---|---|---|---|---|
| 3 | Smooth Line | Technique | Any | −0.8s | — | — |
| 2 | Brake Late | Technique | Hairpin, Chicane | −1.4s | brakes 6 | — |
| 2 | Carry Speed | Technique | Sweeper, Slalom | −1.4s | tires 6 | — |
| 2 | Hard Launch | Technique | Launch, Finish | −1.2s | trans 5, tires 4 | — |
| 1 | Attack | Aggression | Corners | −2.4s | tires 12 | Inject 1 Strain |
| 1 | Send It | Aggression | Launch, Finish | −2.2s | engine 10, trans 8 | Inject 1 Strain |
| 2 | Look Ahead | Utility | — | — | — | Draw 2 |
| 1 | Coast | Technique | Any | +0.4s | — | Restore 6 brakes & 6 tires |

### 4b. Car identity (replaces/adds to skeleton)

- **Miata (NA/NB)**: +2 *Momentum Dance* (Technique, corners, −1.6s, tires 3). Remove 1 Hard Launch. *Efficient cornering, weak power.*
- **Integra GS-R**: +1 *VTEC Window* (Technique, Launch/Sweeper, −1.6s, engine 6). +1 Smooth Line. *Balanced.*
- **Corvette C6**: +2 *Big Power* (Technique, Launch/Sweeper/Finish, −1.9s, tires 8). Remove 1 Brake Late, remove 1 Carry Speed. *Monster on power segments, thin cornering suite.*
- JDM unlockables get identity cards at integration time, same pattern (one signature card each).

### 4c. Tires

- **All-Season**: no cards. Wear costs on tire-cost cards +2 (hard compound struggles).
- **Street Performance**: baseline, no changes.
- **Racing Compound**: +2 *Grip Reserve* (Utility: your next Line card this segment costs 0 tire wear and gains −0.4s). After every race, tires wear an extra 8 (compound life).

### 4d. Mods (Stage 1)

- **Engine** (filter + catback): +1 *Breathe* (Technique, Launch/Sweeper/Finish, −1.5s, engine 4).
- **Brakes** (pads + lines): +1 *Threshold Brake* (Technique, Hairpin/Chicane, −1.7s, brakes 4). Brake-system hazards fire at half severity.
- **Suspension** (sway bars): +1 *Composure* (Utility: keep momentum even if this segment goes over par; remove 1 Strain from hand).
- **Safety** (seat + harness): no cards — **hand size 5**. Pure agency, no speed, matches "planted driver sees more options."

### 4e. Hazards (injected, never bought)

| Card | System | Fires | Effect |
|---|---|---|---|
| Brake Fade | brakes | in hand at a Hairpin/Chicane | +2.0s, brakes −12 |
| Tire Delamination | tires | in hand at any corner | +2.0s, tires −12, +1 cone |
| Overheat | engine | in hand at Launch/Sweeper/Finish | +2.2s, engine −12 |
| Gear Grind | trans | in hand at Launch/Slalom/Finish | +1.8s, trans −10 |

Fire = automatic when the segment type matches while it's in your hand; then it discards. In a non-matching segment it just sits there clogging a slot (dread). Gauge coverage halves the fired time penalty (§7).

### 4f. Strain (injected by Aggression cards)

*Strain* — unplayable. May be discarded as your Utility play for the segment (composure spent managing the car). 2+ Strain in hand at segment start: +0.5s per extra Strain.

## 5. Affinity & resolution math

- On-affinity Line card: full time delta. Off-affinity: **half delta, +25% wear cost** — you can always muscle through, it's just worse. No bricked hands.
- Segment pars (current mid-tier times): Launch 6.0 · Hairpin 9.6 · Sweeper 8.4 · Slalom 9.0 · Chicane 8.7 · Finish 5.4 ≈ 47s par.
- Target time = best-case play × 1.0 + buffer, retuned by simulation to preserve the **~50% win rate for a built car / ~20% stock** curve.
- Car corner multipliers (Miata 0.90 etc.) still apply to corner pars — identity stays mechanical.

## 6. Momentum

Beat par in a segment → gain **Momentum** (max 1): next segment's Line card gets −0.4s.
Go over par → lose it. Suspension's *Composure* protects it. Simple, chains segments, rewards consistency — the "clean run" feeling autocross is about.

## 7. Hazards, gauges, and the one surviving die

- Skipped maintenance: **2 hazard cards** of that system, shown to the player pre-race (dread pillar — you *know* they're in there).
- Wear pool <50% at race start: +1 hazard of that system. <30%: +2.
- **Gauges**: owning the matching gauge (a) shows exact count + type of hazards in the deck pre-race, (b) halves the fired time penalty (you caught it early). No gauge = you know something's wrong ("2 unknown hazards"), not what or where.
- **The d6 dies entirely in v1.** Hazard severity is fixed and legible. If runs feel too samey after playtesting, the die's one candidate return is hazard severity (visible, 1.5–3.0s range) — decision deferred until after playtest.

## 8. Career integration (unchanged systems)

- Wear pools persist across months; card costs drain them; Maintain restores and **removes injected hazard cards**.
- Cash/reputation formulas, unlock conditions, work economy, season structure: all unchanged.
- Cones now come only from *Tire Delamination* (and future hazard cards) — deterministic, visible.

## 9. Balance targets & validation

1. Built car, competent play (affinity-aware bot): **~50% win**.
2. Stock car, same bot: **~20%**.
3. Max-aggression-every-segment bot must NOT dominate: Strain + wear + hazard injection should make it lose to the balanced bot over a season. If it doesn't, Strain penalties scale up.
4. Random-card bot: ≤10% (skill gap must exist — this is the anti-boredom metric).
5. A full season at race-heavy cadence should require 3–4 Maintains (wear costs tuned to ~30% pool drain per race).

`scripts/simulate-cardgame.mjs` will run all five bots × 500 seasons before any UI work — same order as every prior system.

## 10. Visuals

- **Race view kept** as-is on top (updates to be discussed separately).
- **HUD map**: remake in NFSU/GT style — clean single-weight track outline, position dot, start/finish ticks, apex cones only. (Separate visual pass, user to give direction.)
- **Cards**: vaporwave frames by type (teal/pink/gold/red/gray), pixel-art icons from the existing sprite pack (cars, cones, parts), CRT overlay consistent with everything else.
- **Card back**: the My Garage Life logo from the original asset pack (`menu/garage-life-logo.png`) — needs to be copied into the repo from the first asset ZIP.

## 11. Build order

1. `src/game/cards.js` — card defs + deck builder (pure data/functions).
2. `src/game/raceEngine.js` — hand/draw/play/resolve state machine (pure, no React).
3. `scripts/simulate-cardgame.mjs` — five bots, validate §9 targets, tune numbers.
4. Card UI components (hand, card frame, play interactions) + wire into RaceScreen.
5. Hazard/gauge pre-race reveal panel in PreRaceSetup.
6. HUD map NFSU/GT restyle.
7. Remove dead systems (buttons, outcomeWeights, DiceWidget, reveal screen).
8. Browser playthrough + deploy.
