export const CARD_TYPES = Object.freeze({
  TECHNIQUE: 'technique',
  AGGRESSION: 'aggression',
  UTILITY: 'utility',
  HAZARD: 'hazard',
  STRAIN: 'strain',
});

export const TIMINGS = Object.freeze({
  LINE: 'line',
  PRE_LINE: 'pre-line',
  REACTION: 'reaction',
  PASSIVE: 'passive',
});

export const SYSTEMS = Object.freeze({
  BRAKES: 'brakes',
  TIRES: 'tires',
  ENGINE: 'engine',
  TRANSMISSION: 'transmission',
});

export const DISCIPLINES = Object.freeze({
  AUTOCROSS: 'autocross',
  HPDE: 'hpde',
  TIME_TRIAL: 'time-trial',
  SPEC_RACING: 'spec-racing',
  ROAD_RACING: 'road-racing',
});

export const SEGMENT_TAGS = Object.freeze({
  START: 'start',
  FINISH: 'finish',
  BRAKING: 'braking',
  TIGHT: 'tight',
  FLOWING: 'flowing',
  TRANSITION: 'transition',
  PRECISION: 'precision',
  POWER: 'power',
  STRAIGHT: 'straight',
  COMPLEX: 'complex',
  TRAFFIC: 'traffic',
});

export const DEFAULT_WEAR = Object.freeze({
  brakes: 100,
  tires: 100,
  engine: 100,
  transmission: 100,
});

// Off-affinity multiplier and cone penalty were 0.55 / 2.0, tuned only
// around the "built" (all mods + upgraded tires) win rate. That left a
// stock/no-mods player — the entire early season, by construction — winning
// only ~14-19% even playing optimally (scripts/simulate-cardgame.mjs). Most
// deckbuilders (Slay the Spire, Balatro, etc.) don't gate winnability behind
// full itemization: a competent player with the starting kit should win a
// real share of the time, with upgrades raising margin/economy more than
// flipping win into loss outright. Nudged both values so stock rises to
// ~19-20% without pushing "built" out of its already-tuned 40-60% band —
// see scripts/simulate-progression.mjs for the fuller mods-owned curve this
// was checked against (a single cheap early mod already lifts win rate to
// ~39%, so the real "almost impossible" window is short, not season-long).
export const OFF_AFFINITY_EFFECT_MULTIPLIER = 0.66;
export const OFF_AFFINITY_WEAR_MULTIPLIER = 1.25;
export const FLOW_TIME_BONUS = -0.3;
export const MAX_FLOW = 1;
export const DEFAULT_HAND_SIZE = 4;
export const DEFAULT_DECK_SIZE = 14;
export const CONE_PENALTY_SECONDS = 1.7;
