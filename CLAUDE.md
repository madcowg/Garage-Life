# Garage Life Autocross

React + Vite autocross card game; no backend (course history in `localStorage`). Read `README.md` and `TODO.md` first.

## Style
- Zero filler: no pleasantries, apologies or recap; confirmations only. Push back once with concrete reasons, then execute the owner's decision.
- Diffs only; never echo unmodified code. Targeted reads and searches over broad ones.

## Repo
- Commands: `npm run dev`, `npm run build`, `npm run lint` (oxlint), `npm run test:e2e` (Playwright).
- Visual spec: `docs/DESIGN_LANGUAGE.dc.html`; tokens are `--gl-*` in `src/index.css`.
- Race engine: `packages/card-core-v2` (pure, own tests) via the `src/game/v2.js` adapter. `docs/CARD_GAME_DESIGN.md` predates it.
- Pushes to `main` deploy to GitHub Pages (`.github/workflows/deploy.yml`).
- Keep `CHANGELOG.md` updated as `TODO.md` items land.
