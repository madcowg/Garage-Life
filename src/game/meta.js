// ============================================================================
// META PROGRESSION — the roguelike unlock catalog (design doc §3), persisted
// to localStorage across every career. Unlocks are immediate (usable for the
// rest of the current career the moment they're earned) and permanent
// (never revoked, never reset by a new career) — only starting conditions
// reset, never the catalog.
// ============================================================================

export const META_KEY = "garageLifeMeta";

function defaultMeta() {
  return { unlockedCars: [], unlockedMods: [], careerHistory: [], codexUnlocked: [], achievementsUnlocked: [] };
}

export function loadMeta() {
  try {
    const raw = JSON.parse(localStorage.getItem(META_KEY) || "null");
    if (!raw) return defaultMeta();
    return { ...defaultMeta(), ...raw };
  } catch (e) {
    return defaultMeta();
  }
}

export function saveMeta(meta) {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); }
  catch (e) { /* localStorage unavailable — meta just won't persist */ }
}

export function unlockCar(meta, carId) {
  if (meta.unlockedCars.includes(carId)) return meta;
  const next = { ...meta, unlockedCars: [...meta.unlockedCars, carId] };
  saveMeta(next);
  return next;
}

export function unlockMod(meta, modId) {
  if (meta.unlockedMods.includes(modId)) return meta;
  const next = { ...meta, unlockedMods: [...meta.unlockedMods, modId] };
  saveMeta(next);
  return next;
}

export function unlockCodexEntry(meta, codexId) {
  if (meta.codexUnlocked.includes(codexId)) return meta;
  const next = { ...meta, codexUnlocked: [...meta.codexUnlocked, codexId] };
  saveMeta(next);
  return next;
}

export function unlockAchievement(meta, achievementId) {
  if (meta.achievementsUnlocked.includes(achievementId)) return meta;
  const next = { ...meta, achievementsUnlocked: [...meta.achievementsUnlocked, achievementId] };
  saveMeta(next);
  return next;
}

// Applies both halves of a story trigger's permanent payoff (achievements +
// codex entries) in one call — see story.js resolveTriggerUnlocks.
export function applyTriggerUnlocks(meta, { achievements = [], codex = [] }) {
  let next = meta;
  achievements.forEach(id => { next = unlockAchievement(next, id); });
  codex.forEach(id => { next = unlockCodexEntry(next, id); });
  return next;
}

export function archiveCareer(meta, summary) {
  const next = { ...meta, careerHistory: [summary, ...meta.careerHistory].slice(0, 50) };
  saveMeta(next);
  return next;
}

// A car is available (selectable/purchasable) if it's a starter, or if it's
// been unlocked this career-catalog's lifetime.
export function isCarAvailable(meta, carId, carDef) {
  return carDef.tier === "starter" || meta.unlockedCars.includes(carId);
}

// A mod is available if it has no unlockThreshold (Stage 1 Tires/Maintenance
// — day one) or has been unlocked.
export function isModAvailable(meta, modId, modDef) {
  return !modDef.unlockThreshold || meta.unlockedMods.includes(modId);
}
