# Garage Life — Autocross: TODO / Work Plan

Reference/planning doc. Nothing here gets executed until we explicitly pick
an item to start. Current version: **0.0.1** (see `CHANGELOG.md`). Work done
against this list ships as **0.0.2** — keep the changelog updated as items land.

Gathered from: commit-body history, a GDD-vs-code diff pass, and a
user-provided handoff summary from the cloud claude.ai/code sessions.

## Repo / project conventions (reference)
- No PR flow on this repo — commit and push straight to `main`; GitHub Actions
  deploys to Pages on every push. (Conflicts with this harness's default
  "always open a draft PR" behavior for background jobs — flag before
  pushing anything for real.)
- Canonical visual spec: `docs/DESIGN_LANGUAGE.dc.html`. Tokens are `--gl-*`
  custom properties in `src/index.css`.
- Race engine: `packages/card-core-v2` (standalone, pure/headless, own
  tests + balance-sim) + `src/game/v2.js` adapter bridging career state to
  it. This is why `docs/CARD_GAME_DESIGN.md` reads stale against the code
  (Momentum/Strain vs. `control`/Flow/Unsettled) — doc predates the v2
  rewrite, not undocumented drift.
- Before calling any change done: `npm run lint` && `npm run build`. Any
  `card-core-v2` change: also `node --test tests/*.test.mjs` and
  `npm run simulate` from that package dir. Verify UI live via `npm run dev`
  (port 5173). Commit messages: multi-line, explain *why*.

## Local-LLM delegation policy (audited 2026-07-28)
Ollama confirmed reachable at `127.0.0.1:11434` with `qwen2.5:latest`
(code/boilerplate-shaped work), `deepseek-r1:latest` (multi-step reasoning,
iterative tuning loops — good fit for "run nonstop" tasks like balance
tuning), and `llama3.1:latest` (general/draft copy, dialogue/flavor text).
**None of the three have vision** — they can't look at sprites/images, so
art-adjacent tasks route to the local SDXL/ZLUDA `image-gen` server instead
(no dedicated `visual-asset-gen` module exists in this repo yet, so call the
global `image-gen` MCP tool directly). Judgment calls — architecture,
balance decisions, cross-file design — stay with Claude/the user regardless
of what's delegatable below.

Each item below is tagged **[owner]**:
- **[Claude]** — architecture/cross-file/design judgment, not delegatable
- **[Claude→qwen2.5]** — Claude specs it, qwen2.5 implements the boilerplate
- **[deepseek-r1]** — multi-step reasoning or iterative simulate/tune loop, good nonstop-background candidate
- **[llama3.1]** — draft copy/flavor text/dialogue, needs a human edit pass after
- **[image-gen]** — local SDXL server, not an Ollama text model
- **[Claude/user]** — a decision only a person (or Claude with the user) can make

---

## Phase 0 — Quick wins / housekeeping
1. [x] **[Claude/user]** Decide fate of `CHEAT_CODE` card (confirmed 97%+ win rate) — nerf, remove, or gate it — **kept as-is**, documented in README as intentional
2. [x] **[Claude→qwen2.5]** Make "did I win this event" visually clear at a glance (currently hard to tell) — headline recolored to green/red + ✓/✗ glyph, "Target missed" replaces ambiguous "Event complete"
3. [x] **[Claude/user]** Confirm single `basic_diagnostics` gauge (vs. spec's per-system granularity) is intentional; if so, add to README's "known simplifications" — confirmed, documented

## Phase 1 — Validation tooling (do before further balance work)
4. [x] **[Claude→qwen2.5]** Build `scripts/simulate-cardgame.mjs` (5-bot headless validation, per spec's Build Order step 3) — **already existed** under `packages/card-core-v2/scripts/`, wired to `npm run simulate`; verified: 15/15 tests pass, 12/12 balance gates pass
5. [x] **[Claude]** Re-verify Season/Career tuning numbers against `SEASON1_DESIGN.md` §2/§8 formulas, report discrepancies — **no discrepancies**: `computeRaceReward`/`resolveWork` in `career.js` match the cash/reputation and tenure-modified-d20 work formulas exactly. **Finding:** root-level `scripts/simulate-season.mjs` and `tune-target-buffer.mjs` (which §2/§9 cite for validation) are dead — both import the deleted pre-v2 `src/game/logic.js`. Not fixed (out of scope for a re-verify pass); flagged for a decision below.
6. [x] **[deepseek-r1 draft → Claude review]** Rewrite `docs/CARD_GAME_DESIGN.md` to match the actual `card-core-v2`/`v2.js` engine terminology — deepseek-r1's draft had serious factual errors (hallucinated the course-element table, called Cheat Code "unused" when it's actually beater_van's signature 97%-win-rate card, dropped several hazards/vehicles), so Claude rewrote it directly from the source instead of editing the draft

## Phase 2 — Visual foundation (user's stated prerequisite for the paint booth)
7. [x] **[Claude→qwen2.5 mechanical pass, Claude decides fixes]** Design-doc-wide style/color audit — grep all hardcoded colors in `src/` not using `--gl-*` tokens, diff against `DESIGN_LANGUAGE.dc.html`, Claude judges what to fix. Sprites explicitly excluded from this pass. **Result:** most hardcoded hex found (RoadView.jsx car paint, track.js/TrackCanvas.jsx/CourseLog.jsx canvas fillStyle, theme.js, RolodexNavButton.jsx gradient) are legitimate exceptions — canvas 2D can't consume CSS custom properties, car-paint colors are vehicle art not UI, and the Rolodex gradient matches `DESIGN_LANGUAGE.dc.html` verbatim. Fixed the two real violations: `shared.jsx`'s `ToggleRow` had a stray `#122b28` active-bg and a flat `#777` desc-text color despite the rest of the file using `theme.js`'s token mirror — added `tealFill`/`textMuted` to `theme.js`'s `C` object and wired them in.

## Phase 3 — Paint booth (big feature, depends on Phase 2)
8. [~] **[Claude]** Paint Shop location integration + paint booth mechanic — **partially done, blocked on mask art:**
   - [x] Cropped `paint shop clean/dirty.png` (were raw annotated reference sheets) to `paint-shop-clean.png` / `paint-shop-dirty.png`; raw sheets kept alongside as reference, not deleted
   - [x] Added `LOCATIONS.paintShop` entry (`story.js`) and a `PaintShopScreen.jsx` shell (booth background + "coming soon" message), wired into `App.jsx`'s screen switch. **Not linked from any nav button yet** — intentionally not shipped as live functionality
   - [ ] **3 independently-recolorable masked layers (paint/wheels/glass): BLOCKED.** Tried two auto-segmentation approaches on the Miata NB `garage-front.png` sprite (HSV hue thresholding, then k-means color clustering) — both fail for the same root cause: this cel-shaded pixel art reuses the same shading-band palette across different materials (e.g. one cluster caught window glass + wheel spokes + headlight detail together), so color alone can't separate paint/wheel/glass in the flattened image. Confirmed no layered source file (PSD/Aseprite/etc.) exists in any asset zip to re-export from either. **Needs hand-painted masks per car, or new art authored with separated layers from the start** — not a coding task. 15 cars × 3 masks once a path is chosen.
   - [ ] Cosmetic mods (aero, wheel swaps) visually update alongside a paint change — depends on masks existing
   - [ ] Color picker: 20 presets **[llama3.1 could draft preset name/flavor copy]** + 10 hidden colors. **Decided 2026-07-29:** all 13 achievements grant something, 10 of them specifically unlock a color — pending picking which 10 (see Needs User Input) and the 20 preset colors/names themselves (neither designed yet)
   - [ ] Economy: $100 one-time unlock per career, then $10/recolor (unchanged from original spec)
   - [x] Unlock trigger decided 2026-07-29: winning a season for the first time (achievements) — **and** a secret method beyond achievements: max Friendly standing with a specific NPC (which NPC — TBD, see Needs User Input)
   - [ ] Whole roster gets paint support at once, not staged car-by-car (unchanged intent, blocked on masks same as above)

## Phase 4 — Art asset backfill (independent, parallelizable via image-gen alongside any code phase)
9. [ ] **[image-gen]** Dead Reckoning Garage background art
10. [ ] **[image-gen]** Evo VI `front.png` sprite (currently rear-3/4 only; non-blocking since RoadView is rear-only today)
11. [ ] **[image-gen]** NPC portraits — Rex, Dez, Marisol, Walt (codex is text-only today)
12. [ ] **[image-gen]** Mod icons (`ItemCard.jsx`'s `icon` prop is already wired, unpopulated)
13. [ ] **[image-gen]** Tire icons — stock / extreme_summer / slicks
14. [ ] **[image-gen]** Achievement badges × 13 (text/quip-only today)

## Phase 5 — Progression/economy features
15. [ ] **[Claude/user spec → Claude→qwen2.5 implement]** Buyable bigger garage (past the current 2-car cap)
16. [ ] **[Claude/user spec → Claude→qwen2.5 implement]** BMW Legends roster (E36/E46/E39/E90) unlock-tier gate — data + sprites already exist
17. [ ] **[llama3.1 draft → Claude/user decide]** Define achievement rewards (currently unclear what unlocking one actually grants beyond the badge)
18. [ ] **[deepseek-r1, iterative]** Race-type/economy balancing pass — uses Phase 1's simulate tooling; good nonstop-background candidate once the harness exists

## Phase 6 — Content expansion (largest scope, sequence last)
19. [ ] **[llama3.1 draft dialogue → Claude wires mechanics]** More NPCs
20. [ ] **[Claude architecture + llama3.1 flavor text]** More race types/locations, incl. street-racing visuals + mechanics
21. [ ] **[Claude]** More race modes/seasons
22. [ ] **[Claude]** Multi-car HUD minimap dots — blocked until a multiplayer/series mode exists to consume it; revisit alongside item 21

---

## Floated Ideas / Notes (not firm commitments, no phase assigned)
- Early-mod win-rate jump (14–19% stock → 39% after one cheap mod) — logged as balance-pass context (feeds item 18), not a stated bug on its own
- ~~`beaterVan` intentionally has no planned sprite art~~ — **incorrect**, `beaterVan-front.png`/`-rear.png` already exist and are wired in `carAssets.js`. The Titty Twister has full sprite coverage like the rest of the roster.

## Needs User Input / Open Questions
- `scripts/simulate-season.mjs` and `scripts/tune-target-buffer.mjs` are dead (import deleted pre-v2 `src/game/logic.js`) — delete them, or port to the `card-core-v2` API? Career-economy win-rate claims (§2's "~39-44% season average") can't be re-run until one of those happens.
- On the (closed, no-bug) beater_van DNF reports: were you skipping Walk the Course when you saw them, fresh or continued career? (Only matters if the perception recurs.)
- **Paint booth masking approach**: hand-painted masks per car, or new layered source art authored from scratch? Either way, who's doing that art (not a Claude task) — needed before the recolor mechanic itself can be built at all.
- Which 10 of the 13 achievements unlock a paint-booth color (decided: 10 of 13 do); what do the other 3 grant instead (ties into item 17, achievement rewards — not yet designed)
- Which NPC's max-Friendly standing unlocks the paint booth's secret color (decided: NPC-relationship-based, NPC itself undecided)
- The 20 preset colors + names, and which 10 of them are the achievement-gated "hidden" set — none of this is designed yet

## UI & Operational Fixes (yours to add)
- [ ] —
