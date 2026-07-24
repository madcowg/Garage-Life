# Garage Life — Autocross

A solo time-trial autocross card game prototype: procedurally generated SNES-style
top-down courses, dice-driven consequence resolution, and a car-state deck where
mods and maintenance shift outcome *probabilities* rather than granting flat bonuses.

Built with React + Vite. No backend — course history is saved to the browser's
`localStorage`.

## What's in here

- **Segment-based courses** — Launch → 4 randomized corners (Hairpin/Sweeper/Slalom/Chicane) → Finish, regenerated every race.
- **Track map** — procedurally built top-down course rendered on `<canvas>` at a low internal resolution and scaled up with `image-rendering: pixelated`, for a Mario Kart / F-Zero-style SNES look. Autocross uses cones, not curbs — slalom cones run single-file down the centerline; corner cones mark both edges.
- **Course Log** — every finished run's track layout is saved to `localStorage` with a thumbnail, so you can browse the season's courses later.
- **Consequence die** — every decision rolls a real d6 (visualized bottom-right); the rolled value directly drives the time penalty math, it's not decorative.
- **HUD** — minimap, running time vs. target, and wear meters (Engine/Trans only visible if you installed the matching gauge — Tires/Brakes are always visible per the design doc).

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## Deploy to GitHub Pages

This repo includes `.github/workflows/deploy.yml`, which builds and deploys to
GitHub Pages automatically on every push to `main`.

**One-time setup after you push this repo to GitHub:**

1. Go to your repo → **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or re-run the workflow from the **Actions** tab).
4. Your game will be live at `https://<your-username>.github.io/<repo-name>/`.

**Important:** `vite.config.js` has `base: '/garage-life-autocross/'`. If you name
your GitHub repo something else, update that line to match — it must be
`/<your-repo-name>/` or the deployed assets will 404.

## Project structure

```
src/
  game/
    data.js     — cars, mods, tires, gauges, segment definitions
    logic.js    — pure game logic (weighted outcomes, dice resolution, time calc)
    track.js    — procedural track path generator + shared canvas draw routine
  components/
    TrackCanvas.jsx  — full course view (race + results screens)
    MiniMap.jsx      — small HUD map
    DiceWidget.jsx   — animated d6, bottom-right corner
    HUD.jsx          — wear meters + timer + minimap strip
    CourseLog.jsx    — season course history (localStorage)
  App.jsx       — Setup / Race / Results / Course Log screen flow
```

## Design notes / known simplifications

- Car corner bonus/penalty (Miata −10%, Corvette +10% on corner segments only)
  is applied directly to segment time, matching the GDD text literally.
- Target time is computed per-generated-course (best-case sum of that run's
  segments for that car), not a fixed number — since the course itself is
  randomized, a fixed target wouldn't be meaningful.
- Balance was sanity-checked with a headless 500-race-per-condition simulation
  before this was built out visually — a stock car is *meant* to struggle to
  beat target; a fully built one should win most of the time.
