// Independent balance verification for card-core-v2 — reproduces the
// BALANCE_REPORT.md methodology: starter cars × build states × bots,
// seeded seasons of autocross events with persistent wear and a simple
// maintain policy. Run: npm run simulate  (env: SEASONS, EVENTS, SEED)
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  runAutocrossEvent,
  balancedBot, cleanBot, aggressionBot, affinityBot, createRandomBot,
  mulberry32, DEFAULT_WEAR,
} from '../src/game/index.js';

const SEASONS = Number(process.env.SEASONS ?? 500);
const EVENTS = Number(process.env.EVENTS ?? 8);
const SEED = Number(process.env.SEED ?? 20260725);

const CARS = ['miata_nb', 'integra_gsr', 'corvette_c6'];
const BUILDS = {
  stock: { tireId: 'street_performance', modIds: [] },
  built: { tireId: 'racing_compound', modIds: ['stage1_engine', 'stage1_brakes', 'stage1_suspension', 'driver_fit', 'basic_diagnostics'] },
};
const BOTS = {
  affinity: () => affinityBot,
  balanced: () => balancedBot,
  clean: () => cleanBot,
  aggression: () => aggressionBot,
  random: (rng) => createRandomBot(rng),
};

// Maintain policy mirroring sensible play: full service (restore to 100)
// whenever any system drops below 50 before an event. Counts maintains.
function runSeason({ vehicleId, build, botFactory, rng }) {
  let wear = { ...DEFAULT_WEAR };
  let wins = 0, cones = 0, runsCounted = 0, maintains = 0, dnfEvents = 0;
  let marginSum = 0, marginCount = 0;
  for (let e = 0; e < EVENTS; e += 1) {
    if (Object.values(wear).some(v => v < 50)) { wear = { ...DEFAULT_WEAR }; maintains += 1; }
    const event = runAutocrossEvent({
      vehicleId, tireId: build.tireId, modIds: build.modIds,
      bot: botFactory(rng), random: rng, wear, courseWalks: 2,
    });
    wear = event.wearAfter;
    if (event.won) wins += 1;
    if (event.bestTime == null) dnfEvents += 1;
    else { marginSum += event.bestTime - event.targetTime; marginCount += 1; }
    for (const run of event.runs) { if (!run.dnf) { cones += run.cones; runsCounted += 1; } }
  }
  return { wins, events: EVENTS, cones, runsCounted, maintains, dnfEvents, marginSum, marginCount };
}

const results = [];
for (const vehicleId of CARS) {
  for (const [buildName, build] of Object.entries(BUILDS)) {
    for (const [botName, botFactory] of Object.entries(BOTS)) {
      const rng = mulberry32(SEED ^ (CARS.indexOf(vehicleId) << 20) ^ (buildName === 'built' ? 1 << 19 : 0) ^ (Object.keys(BOTS).indexOf(botName) << 14));
      let wins = 0, events = 0, cones = 0, runs = 0, maintains = 0, dnfs = 0, marginSum = 0, marginCount = 0;
      for (let s = 0; s < SEASONS; s += 1) {
        const season = runSeason({ vehicleId, build, botFactory, rng });
        wins += season.wins; events += season.events; cones += season.cones; runs += season.runsCounted;
        maintains += season.maintains; dnfs += season.dnfEvents; marginSum += season.marginSum; marginCount += season.marginCount;
      }
      results.push({
        vehicleId, build: buildName, bot: botName,
        winRate: +(100 * wins / events).toFixed(1),
        conesPerRun: +(cones / Math.max(1, runs)).toFixed(2),
        maintainsPerSeason: +(maintains / SEASONS).toFixed(2),
        dnfEventPct: +(100 * dnfs / events).toFixed(1),
        meanTargetMargin: marginCount ? +(marginSum / marginCount).toFixed(2) : null,
      });
    }
  }
}

mkdirSync(new URL('../results/', import.meta.url), { recursive: true });
writeFileSync(new URL('../results/simulation-results.json', import.meta.url), JSON.stringify({ SEASONS, EVENTS, SEED, results }, null, 2));

console.log(`card-core-v2 balance verification — ${SEASONS} seasons × ${EVENTS} events, seed ${SEED}\n`);
const pad = (v, n) => String(v).padStart(n);
console.log('vehicle       build  bot         win%   cones/run  maint/season  margin');
for (const r of results) {
  console.log(`${r.vehicleId.padEnd(13)} ${r.build.padEnd(6)} ${r.bot.padEnd(10)} ${pad(r.winRate, 5)}  ${pad(r.conesPerRun, 9)}  ${pad(r.maintainsPerSeason, 12)}  ${pad(r.meanTargetMargin ?? '—', 6)}`);
}

// Acceptance gates from the design/balance targets
const get = (v, b, bot) => results.find(r => r.vehicleId === v && r.build === b && r.bot === bot);
const gates = [];
for (const car of CARS) {
  const built = get(car, 'built', 'affinity'), stock = get(car, 'stock', 'affinity');
  gates.push([`${car} built affinity 40-60%`, built.winRate >= 40 && built.winRate <= 60, built.winRate]);
  gates.push([`${car} stock affinity 10-30%`, stock.winRate >= 10 && stock.winRate <= 30, stock.winRate]);
  gates.push([`${car} random ≤10%`, get(car, 'built', 'random').winRate <= 10, get(car, 'built', 'random').winRate]);
  gates.push([`${car} aggression loses to affinity`, get(car, 'built', 'aggression').winRate < built.winRate, get(car, 'built', 'aggression').winRate]);
}
console.log('\nAcceptance gates:');
let failed = 0;
for (const [name, ok, value] of gates) { console.log(` ${ok ? 'PASS' : 'FAIL'}  ${name} (${value}%)`); if (!ok) failed += 1; }
process.exitCode = failed ? 1 : 0;
