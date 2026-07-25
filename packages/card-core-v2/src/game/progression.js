import { DISCIPLINES } from './constants.js';

export const CAREER_DISCIPLINE_PATH = Object.freeze([
  { tier: 1, suggestedSeason: 1, disciplineId: DISCIPLINES.AUTOCROSS, focus: ['course-reading', 'vision', 'weight-transfer', 'precision', 'car-control'] },
  { tier: 2, suggestedSeason: 2, disciplineId: DISCIPLINES.HPDE, focus: ['flags', 'point-bys', 'instructor-goals', 'consistency', 'track-awareness'] },
  { tier: 3, suggestedSeason: 3, disciplineId: DISCIPLINES.TIME_TRIAL, focus: ['warm-up', 'hot-lap', 'traffic-management', 'temperature-window', 'fastest-lap'] },
  { tier: 4, suggestedSeason: 4, disciplineId: DISCIPLINES.SPEC_RACING, focus: ['race-starts', 'drafting', 'overtaking', 'defending', 'flags', 'contact-risk'] },
  { tier: 5, suggestedSeason: 5, disciplineId: DISCIPLINES.ROAD_RACING, focus: ['setup', 'fuel', 'tires', 'pit-strategy', 'damage', 'class-performance'] },
]);

export function disciplinesAvailableBySeason(season) {
  return CAREER_DISCIPLINE_PATH.filter((entry) => entry.suggestedSeason <= season);
}
