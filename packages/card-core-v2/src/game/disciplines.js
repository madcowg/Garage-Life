import { DISCIPLINES, SEGMENT_TAGS } from './constants.js';
import { sample } from './random.js';

const AUTOCROSS_ELEMENTS = Object.freeze([
  { id: 'slalom', name: 'Slalom', par: 6.8, precision: 2, tags: [SEGMENT_TAGS.TRANSITION, SEGMENT_TAGS.PRECISION, SEGMENT_TAGS.COMPLEX] },
  { id: 'offsets', name: 'Offset Gates', par: 6.2, precision: 2, tags: [SEGMENT_TAGS.TRANSITION, SEGMENT_TAGS.PRECISION] },
  { id: 'sweeper', name: 'Sweeper', par: 7.1, precision: 1, tags: [SEGMENT_TAGS.FLOWING, SEGMENT_TAGS.POWER] },
  { id: 'turnaround', name: 'Turnaround', par: 7.8, precision: 2, tags: [SEGMENT_TAGS.BRAKING, SEGMENT_TAGS.TIGHT, SEGMENT_TAGS.COMPLEX] },
  { id: 'chicago-box', name: 'Chicago Box', par: 7.0, precision: 3, tags: [SEGMENT_TAGS.BRAKING, SEGMENT_TAGS.TRANSITION, SEGMENT_TAGS.PRECISION, SEGMENT_TAGS.COMPLEX] },
  { id: 'decreasing-radius', name: 'Decreasing Radius', par: 7.4, precision: 2, tags: [SEGMENT_TAGS.BRAKING, SEGMENT_TAGS.TIGHT, SEGMENT_TAGS.COMPLEX] },
]);

export const DISCIPLINE_RULES = Object.freeze({
  [DISCIPLINES.AUTOCROSS]: { id: DISCIPLINES.AUTOCROSS, name: 'Autocross', competitive: true, scoring: 'best-corrected-run', defaultRuns: 4, handSize: 4, baseDeckSize: 14, conePenaltySeconds: 2, dnfHasNoTime: true, courseVisibleBeforeRun: true, gaugeBehavior: 'pre-run-information-only', thermalHazardScale: 0.55, eventFlow: ['registration', 'tech-inspection', 'course-walk', 'drivers-meeting', 'work-assignment', 'grid', 'timed-runs', 'results'], generateCourse(random) { const course = [{ id: 'start', name: 'Start', par: 4.8, precision: 1, tags: [SEGMENT_TAGS.START, SEGMENT_TAGS.POWER, SEGMENT_TAGS.STRAIGHT] }]; const used = new Set(); while (course.length < 6) { const element = sample(AUTOCROSS_ELEMENTS, random); if (used.size < AUTOCROSS_ELEMENTS.length && used.has(element.id)) continue; used.add(element.id); course.push({ ...element, tags: [...element.tags] }); } course.push({ id: 'finish', name: 'Finish Gate', par: 4.4, precision: 2, tags: [SEGMENT_TAGS.FINISH, SEGMENT_TAGS.POWER, SEGMENT_TAGS.PRECISION] }); return course; } },
  [DISCIPLINES.HPDE]: { id: DISCIPLINES.HPDE, name: 'HPDE', competitive: false, scoring: 'instructor-objectives-and-consistency', courseVisibleBeforeRun: true, passingModel: 'point-by-and-approved-zones', notes: 'HPDE is driver education, not wheel-to-wheel competition.' },
  [DISCIPLINES.TIME_TRIAL]: { id: DISCIPLINES.TIME_TRIAL, name: 'Time Trial', competitive: true, scoring: 'fastest-lap', passingModel: 'experience-tiered-point-by' },
  [DISCIPLINES.SPEC_RACING]: { id: DISCIPLINES.SPEC_RACING, name: 'Spec Racing', competitive: true, scoring: 'finishing-position', passingModel: 'wheel-to-wheel-racecraft' },
  [DISCIPLINES.ROAD_RACING]: { id: DISCIPLINES.ROAD_RACING, name: 'Road Racing', competitive: true, scoring: 'finishing-position', passingModel: 'wheel-to-wheel-racecraft' },
});

export function getDiscipline(disciplineId) { const discipline = DISCIPLINE_RULES[disciplineId]; if (!discipline) throw new Error(`Unknown discipline: ${disciplineId}`); return discipline; }
