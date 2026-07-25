import { BASE_AUTOCROSS_DECK, getCard } from './cards.js';
import { DEFAULT_DECK_SIZE, DEFAULT_WEAR, DISCIPLINES, SYSTEMS } from './constants.js';
import { getDiscipline } from './disciplines.js';
import { getMod, getTire } from './mods.js';
import { getVehicle } from './vehicles.js';

function replaceFirst(deck, remove, addId) {
  const candidates = Array.isArray(remove) ? remove : [remove];
  const removeId = candidates.find((candidate) => deck.includes(candidate));
  if (!removeId) throw new Error(`Cannot add ${addId}; none of [${candidates.join(', ')}] are in the deck.`);
  deck[deck.indexOf(removeId)] = addId;
}

function applyReplacements(deck, replacements = []) {
  for (const replacement of replacements) replaceFirst(deck, replacement.remove, replacement.add);
}

function mergePassives(target, source = {}) {
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'number') target[key] = (target[key] ?? 0) + value;
    else if (typeof value === 'boolean') target[key] = Boolean(target[key] || value);
    else target[key] = value;
  }
}

export function buildCompetitiveDeck({ disciplineId = DISCIPLINES.AUTOCROSS, vehicleId, tireId = 'street_performance', modIds = [] }) {
  const discipline = getDiscipline(disciplineId);
  if (disciplineId !== DISCIPLINES.AUTOCROSS) throw new Error(`Competitive deck package for ${disciplineId} is not implemented yet.`);
  const vehicle = getVehicle(vehicleId);
  if (vehicle.status === 'planned') throw new Error(`${vehicle.name} is registered as a future unlockable but has no validated identity package yet.`);
  const tire = getTire(tireId);
  const mods = modIds.map(getMod);
  const deck = [...BASE_AUTOCROSS_DECK];
  const passives = {};
  applyReplacements(deck, vehicle.replacements);
  for (const mod of mods) { applyReplacements(deck, mod.replacements); mergePassives(passives, mod.passive); }
  applyReplacements(deck, tire.replacements);
  mergePassives(passives, tire.passive);
  const expectedSize = discipline.baseDeckSize ?? DEFAULT_DECK_SIZE;
  if (deck.length !== expectedSize) throw new Error(`Competitive deck must remain ${expectedSize} cards; received ${deck.length}.`);
  for (const cardId of deck) getCard(cardId);
  return { cardIds: deck, passives, vehicle, tire, mods };
}

export function buildHazardDeck({ skippedMaintenance = [], wear = DEFAULT_WEAR, skippedCourseWalk = false }) {
  const cards = [];
  const hazardForSystem = { [SYSTEMS.BRAKES]: 'long-pedal', [SYSTEMS.TIRES]: 'grip-mismatch', [SYSTEMS.ENGINE]: 'heat-soak', [SYSTEMS.TRANSMISSION]: 'missed-shift' };
  for (const system of skippedMaintenance) { const hazard = hazardForSystem[system]; if (!hazard) throw new Error(`Unknown maintenance system: ${system}`); cards.push(hazard, hazard); }
  for (const [system, condition] of Object.entries(wear)) { const hazard = hazardForSystem[system]; if (!hazard) continue; if (condition < 30) cards.push(hazard, hazard); else if (condition < 50) cards.push(hazard); }
  if (skippedCourseWalk) cards.push('course-confusion', 'course-confusion');
  return cards;
}
