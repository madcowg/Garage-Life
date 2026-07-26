# My Garage Life Card Core v2

A headless, dependency-free implementation of the redesigned **“The Deck Is the Car”** autocross system.

## What this implements

- Fixed 14-card competitive deck. Chassis, tires, and modifications replace cards rather than causing uncontrolled deck bloat.
- Three validated starter chassis: Miata NB, Integra GS-R, Corvette C6.
- Eight registered future vehicle unlocks, deliberately blocked from play until their identity packages are simulated.
- Real autocross event structure: course walk, grid context, four timed runs, two-second cone penalties, DNF, and best corrected run.
- Technique, Aggression, Utility, Hazard, and Unsettled cards.
- Direct Aggression consequence: Unsettled enters the hand immediately.
- Flow earned only by a clean, on-affinity Technique play.
- Persistent wear and pre-event hazard injection.
- Information-only diagnostics preview rather than an automatic gauge speed bonus.
- Separate discipline definitions for Autocross, HPDE, Time Trial, Spec Racing, and Road Racing.
- Five headless bots and seeded season simulation.

## Run

```bash
npm test
npm run simulate
```

Optional simulation controls:

```bash
SEASONS=500 EVENTS=8 SEED=20260725 npm run simulate
```

Results are written to `results/simulation-results.json`.

## Integration

Copy `src/game` into the React project. The pure game modules do not import React or browser APIs. The existing UI can consume:

- `buildCompetitiveDeck()` for Garage/Pre-Race deck display.
- `runAutocrossEvent()` for event resolution.
- `DISCIPLINE_RULES` and `CAREER_DISCIPLINE_PATH` for progression UI.
- `hazardPreview` for the pre-race inspection panel.

The package is isolated under `packages/card-core-v2` so the existing app can integrate it without overwriting current UI files.
