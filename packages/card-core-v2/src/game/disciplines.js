import { DISCIPLINES, SEGMENT_TAGS } from './constants.js';
import { shuffle } from './random.js';

const AUTOCROSS_ELEMENTS = Object.freeze([
  { id: 'slalom', name: 'Slalom', par: 6.8, precision: 2, tags: [SEGMENT_TAGS.TRANSITION, SEGMENT_TAGS.PRECISION, SEGMENT_TAGS.COMPLEX] },
  { id: 'offsets', name: 'Offset Gates', par: 6.2, precision: 2, tags: [SEGMENT_TAGS.TRANSITION, SEGMENT_TAGS.PRECISION] },
  { id: 'sweeper', name: 'Sweeper', par: 7.1, precision: 1, tags: [SEGMENT_TAGS.FLOWING, SEGMENT_TAGS.POWER] },
  { id: 'turnaround', name: 'Turnaround', par: 7.8, precision: 2, tags: [SEGMENT_TAGS.BRAKING, SEGMENT_TAGS.TIGHT, SEGMENT_TAGS.COMPLEX] },
  { id: 'chicago-box', name: 'Chicago Box', par: 7.0, precision: 3, tags: [SEGMENT_TAGS.BRAKING, SEGMENT_TAGS.TRANSITION, SEGMENT_TAGS.PRECISION, SEGMENT_TAGS.COMPLEX] },
  { id: 'decreasing-radius', name: 'Decreasing Radius', par: 7.4, precision: 2, tags: [SEGMENT_TAGS.BRAKING, SEGMENT_TAGS.TIGHT, SEGMENT_TAGS.COMPLEX] },
]);

// The last element before 'finish' must not be TIGHT/BRAKING — a course
// "must be completed/settled" before the run to the lights (real-world
// course-design reference, "Designing a Safe Finish"). Two COMPLEX-tagged
// elements landing back to back reads as visual/mental overload. The
// 5-element pool always guarantees at least 2 non-braking candidates (see
// generateCourse below), so a compliant order is always reachable — this
// just needs a few reshuffles, not a full constraint solver.
function isTightEnding(tags) {
  return tags.includes(SEGMENT_TAGS.TIGHT) || tags.includes(SEGMENT_TAGS.BRAKING);
}
function hasAdjacentComplex(elements) {
  for (let i = 0; i < elements.length - 1; i += 1) {
    if (elements[i].tags.includes(SEGMENT_TAGS.COMPLEX) && elements[i + 1].tags.includes(SEGMENT_TAGS.COMPLEX)) return true;
  }
  return false;
}
function applyFlowOrdering(elements, random) {
  let best = elements;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = shuffle(elements, random);
    const last = candidate[candidate.length - 1];
    if (!isTightEnding(last.tags) && !hasAdjacentComplex(candidate)) return candidate;
    best = candidate;
  }
  return best;
}

export const DISCIPLINE_RULES = Object.freeze({
  [DISCIPLINES.AUTOCROSS]: {
    id: DISCIPLINES.AUTOCROSS, name: 'Autocross', competitive: true, scoring: 'best-corrected-run',
    defaultRuns: 4, handSize: 4, baseDeckSize: 14, conePenaltySeconds: 2, dnfHasNoTime: true,
    courseVisibleBeforeRun: true, gaugeBehavior: 'pre-run-information-only', thermalHazardScale: 0.55,
    eventFlow: ['registration', 'tech-inspection', 'course-walk', 'drivers-meeting', 'work-assignment', 'grid', 'timed-runs', 'results'],
    generateCourse(random) {
      // Which 5 of 6 elements get picked is untouched (still a plain random
      // draw, no duplicates) — that selection distribution is what the
      // card-race balance simulation was tuned against, and forcing
      // sweeper's inclusion every time shifted it enough to fail the
      // acceptance gates (corvette_c6 built-affinity crept to 63%, miata_nb
      // stock-affinity dropped to 9.7%, see packages/card-core-v2/scripts/
      // simulate-cardgame.mjs). Only the *order* of whichever 5 got picked
      // is adjusted below, for flow, not which ones.
      const chosen = applyFlowOrdering(shuffle(AUTOCROSS_ELEMENTS, random).slice(0, 5), random);

      const course = [{ id: 'start', name: 'Start', par: 4.8, precision: 1, tags: [SEGMENT_TAGS.START, SEGMENT_TAGS.POWER, SEGMENT_TAGS.STRAIGHT] }];
      chosen.forEach(element => course.push({ ...element, tags: [...element.tags] }));
      course.push({ id: 'finish', name: 'Finish Gate', par: 4.4, precision: 2, tags: [SEGMENT_TAGS.FINISH, SEGMENT_TAGS.POWER, SEGMENT_TAGS.PRECISION] });
      return course;
    },
  },
  [DISCIPLINES.HPDE]: { id: DISCIPLINES.HPDE, name: 'HPDE', competitive: false, scoring: 'instructor-objectives-and-consistency', courseVisibleBeforeRun: true, passingModel: 'point-by-and-approved-zones', notes: 'HPDE is driver education, not wheel-to-wheel competition.' },
  [DISCIPLINES.TIME_TRIAL]: { id: DISCIPLINES.TIME_TRIAL, name: 'Time Trial', competitive: true, scoring: 'fastest-lap', passingModel: 'experience-tiered-point-by' },
  [DISCIPLINES.SPEC_RACING]: { id: DISCIPLINES.SPEC_RACING, name: 'Spec Racing', competitive: true, scoring: 'finishing-position', passingModel: 'wheel-to-wheel-racecraft' },
  [DISCIPLINES.ROAD_RACING]: { id: DISCIPLINES.ROAD_RACING, name: 'Road Racing', competitive: true, scoring: 'finishing-position', passingModel: 'wheel-to-wheel-racecraft' },
});

export function getDiscipline(disciplineId) { const discipline = DISCIPLINE_RULES[disciplineId]; if (!discipline) throw new Error(`Unknown discipline: ${disciplineId}`); return discipline; }
