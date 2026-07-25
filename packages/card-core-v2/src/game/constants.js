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

export const OFF_AFFINITY_EFFECT_MULTIPLIER = 0.55;
export const OFF_AFFINITY_WEAR_MULTIPLIER = 1.25;
export const FLOW_TIME_BONUS = -0.3;
export const MAX_FLOW = 1;
export const DEFAULT_HAND_SIZE = 4;
export const DEFAULT_DECK_SIZE = 14;
export const CONE_PENALTY_SECONDS = 2;
