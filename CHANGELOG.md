# Changelog

All notable changes to this project are documented here. Format: version
bump + entry per work session/milestone, grouped by theme rather than raw
commit order. Practice starts now — keep this updated going forward.

## [0.0.1] — 2026-07-24 to 2026-07-28 (baseline)
Retroactive entry covering everything built before the changelog existed —
first 87 commits, from initial prototype through the current My Garage
Life build.

### Core Gameplay & Race Engine
- Initial autocross prototype: SNES-style procedural track map, dice widget, HUD
- `card-core-v2`: standalone headless deck-builder race engine ("the deck IS the car"), own test suite + balance simulator, integrated via `src/game/v2.js` adapter
- Procedural course generation reworked: fixed a flow bug, added self-intersection validation
- Wear-rate rebalance: `SYSTEM_WEAR_RATE` scales aggregate wear per system (tires 1.0, brakes 0.2, engine 0.1, transmission 0.05) to match autocross's real-world profile
- Balance passes: fixed a near-unwinnable stock/no-mods win rate; mods given real cash prices instead of a unlock-only gate
- Secret "Cheat Code" car/card added

### Career & Progression
- Career mode: persistent state, AP (Action Point) economy
- AP economy overhaul: Shop / Junkyard / Street Racing as real trade-offs, persistent cash HUD
- Reputation split into three tracks: Points, Racing Cred, NPC Standing
- Race AP now committed at registration, not deferred to finish
- Junkyard reworked as a d20 table, tuned twice for correct thresholds
- Event prep/maintenance cost cash by default, with a DIY-for-1-AP alternative
- Title screen with career persistence and settings
- Equipment/car selling, achievement popups
- Rolodex NPC relationship mechanic: Friendly/Antagonize (1 AP each), moves standing + Racing Cred, per-NPC flavor lines
- Rolodex and Collections split into distinct views (people vs. cars/places/achievements); new My Garage screen for owned cars
- 2-car garage cap (`MAX_OWNED_CARS`); full-garage Junkyard finds sell for cash instead of offering a claim

### UI / Design System
- Responsive shell: one layout system across browser and mobile
- Claude Design System applied game-wide; new vehicle roster wired in
- Title screen polish: logo/button sizing, audio+visual gating on click-to-start
- Trading-card style vehicle sprites in car select, garage, and dealership
- Notched Rolodex/Collections nav buttons restored per design doc spec
- Persistent cash pill in every screen header (except during a race) + Garage-shortcut badge
- In-race HUD: clean schematic minimap (no cone clutter), DSEG7 LCD-style timer, fixed road-horizon taper, fixed body-roll lean direction, placeholder trackside scenery
- Helvetica body font for prose/flavor text, top-banner achievement notification

### Art & Assets
- Full 15-car roster cropped and wired, including the BMW/JDM Legends roster
- Sprite edge bleed-through fixed across the roster
- Logo, airfield title-screen background, intro music
- HP/HDL/GRIP/TRN stat icons

### Docs
- Design doc, sprite spec, and card-game design doc established under `docs/`
- README rewritten to match the shipped feature set

## [Unreleased] — working toward 0.0.2
See `TODO.md` for the ordered work plan. Entries move here as they land.

### Phase 0 — Quick wins
- Race results screen: win/loss now reads at a glance — headline banner
  recolored to the design system's green/red gain/loss tokens (was gold/orange,
  too visually similar) with a ✓/✗ glyph and filled pill background; renamed
  "Event complete" to "Target missed" so a loss doesn't read as neutral
- Confirmed `CHEAT_CODE` (beater_van's secret 1-copy identity card, 97%+ win
  rate) as intentional design, not a balance bug — documented in README
- Confirmed single `basic_diagnostics` gauge (vs. GDD's per-system gauges) as
  an intentional v2-rewrite simplification — documented in README
- Corrected stale TODO note claiming beaterVan has no sprite art — it does
  (`beaterVan-front/rear.png`, wired in `carAssets.js`)

### Phase 1 — Validation tooling
- Confirmed `packages/card-core-v2/scripts/simulate-cardgame.mjs` (5-bot
  headless validation) already exists and is wired to `npm run simulate` —
  15/15 tests and 12/12 balance gates pass
- Re-verified `SEASON1_DESIGN.md` §2/§8 cash/reputation/work formulas against
  `career.js` — no discrepancies. Found root-level `simulate-season.mjs` and
  `tune-target-buffer.mjs` are dead (import the deleted pre-v2
  `src/game/logic.js`); flagged for a fix/delete decision, not resolved
- Rewrote `docs/CARD_GAME_DESIGN.md` from a stale v1 proposal to match the
  shipped `card-core-v2` engine (fixed-14 replacement-based deck, Flow/
  control-margin/Unsettled mechanics, real course-element stats, full
  hazard/vehicle/mod tables)

### Phase 2 — Visual foundation
- Design-token audit: confirmed most "hardcoded color" hits are legitimate
  (canvas 2D exceptions, vehicle paint art, a gradient matching the design
  spec verbatim). Fixed the two real violations in `shared.jsx`'s
  `ToggleRow` by extending `theme.js`'s token mirror (`tealFill`, `textMuted`)
