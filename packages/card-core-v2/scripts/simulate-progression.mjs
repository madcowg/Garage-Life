// Win-rate curve as a player incrementally installs mods/tires, rather than
// simulate-cardgame.mjs's two endpoints (stock vs fully built). Answers the
// question that matters for the "winning feels impossible" complaint: how
// long does the unwinnable stretch actually last? Run: node scripts/simulate-progression.mjs
import { runAutocrossEvent, affinityBot, mulberry32 } from '../src/game/index.js';
const SEASONS = 500, EVENTS = 8, SEED = 20260725;
const configs = [
  { name: 'stock (0 mods)', tireId: 'street_performance', modIds: [] },
  { name: '+engine', tireId: 'street_performance', modIds: ['stage1_engine'] },
  { name: '+engine+brakes', tireId: 'street_performance', modIds: ['stage1_engine','stage1_brakes'] },
  { name: '+engine+brakes+susp', tireId: 'street_performance', modIds: ['stage1_engine','stage1_brakes','stage1_suspension'] },
  { name: '+all 3 mods+safety, stock tire', tireId: 'street_performance', modIds: ['stage1_engine','stage1_brakes','stage1_suspension','driver_fit'] },
  { name: 'tires only (racing_compound)', tireId: 'racing_compound', modIds: [] },
  { name: 'full built', tireId: 'racing_compound', modIds: ['stage1_engine','stage1_brakes','stage1_suspension','driver_fit'] },
];
for (const cfg of configs) {
  const rng = mulberry32(SEED);
  let wins = 0, events = 0;
  for (let s = 0; s < SEASONS; s++) {
    let wear = { brakes:100, tires:100, engine:100, transmission:100 };
    for (let e = 0; e < EVENTS; e++) {
      if (Object.values(wear).some(v => v < 50)) wear = { brakes:100, tires:100, engine:100, transmission:100 };
      const event = runAutocrossEvent({ vehicleId: 'miata_nb', tireId: cfg.tireId, modIds: cfg.modIds, bot: affinityBot, random: rng, wear, courseWalks: 2 });
      wear = event.wearAfter;
      if (event.won) wins++;
      events++;
    }
  }
  console.log(`${cfg.name.padEnd(35)} ${(100*wins/events).toFixed(1)}%`);
}
