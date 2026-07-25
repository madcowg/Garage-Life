export const TIRES = Object.freeze({
  all_season: {
    id: 'all_season',
    name: 'All-Season',
    replacements: [],
    passive: { tireWearFlatAdd: 1, controlPenaltyOnPrecision: 1 },
  },
  street_performance: {
    id: 'street_performance',
    name: 'Street Performance',
    replacements: [],
    passive: {},
  },
  racing_compound: {
    id: 'racing_compound',
    name: 'Racing Compound',
    replacements: [
      { remove: ['eyes-up'], add: 'grip-window' },
      { remove: ['smooth-inputs', 'neutral-balance', 'rotate-and-exit'], add: 'grip-window' },
    ],
    passive: {
      postEventTireWear: 5,
      firstRunColdTireTimePenalty: 0.15,
    },
  },
});

export const MODS = Object.freeze({
  stage1_engine: {
    id: 'stage1_engine',
    name: 'Stage 1 Engine',
    replacements: [{ remove: ['clean-launch', 'smooth-inputs', 'neutral-balance'], add: 'breathe' }],
    passive: {},
  },
  stage1_brakes: {
    id: 'stage1_brakes',
    name: 'Pads and Lines',
    replacements: [{ remove: ['threshold-brake'], add: 'upgraded-threshold' }],
    passive: { brakeHazardTimeMultiplier: 0.75 },
  },
  stage1_suspension: {
    id: 'stage1_suspension',
    name: 'Sway Bars',
    replacements: [{ remove: ['balance-throttle', 'smooth-inputs', 'neutral-balance'], add: 'set-the-platform' }],
    passive: {},
  },
  driver_fit: {
    id: 'driver_fit',
    name: 'Driver Fit: Seat, Pedals, Restraint',
    replacements: [],
    passive: {
      startingMulligans: 1,
      safetyRating: 1,
    },
  },
  basic_diagnostics: {
    id: 'basic_diagnostics',
    name: 'Basic Diagnostics',
    replacements: [],
    passive: {
      revealHazardSystems: true,
    },
  },
});

export function getTire(tireId) {
  const tire = TIRES[tireId];
  if (!tire) throw new Error(`Unknown tire: ${tireId}`);
  return tire;
}

export function getMod(modId) {
  const mod = MODS[modId];
  if (!mod) throw new Error(`Unknown mod: ${modId}`);
  return mod;
}
