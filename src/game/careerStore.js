// Career save/continue persistence — separate from meta.js (permanent
// unlock catalog) because a career save is one in-progress run that gets
// overwritten/cleared, while meta only ever grows.
const CAREER_KEY = "garageLifeCareerSave";

export function saveCareerSnapshot(snapshot) {
  try { localStorage.setItem(CAREER_KEY, JSON.stringify(snapshot)); }
  catch { /* localStorage unavailable — continue just won't work */ }
}

export function loadCareerSnapshot() {
  try {
    const raw = JSON.parse(localStorage.getItem(CAREER_KEY) || "null");
    if (!raw || !raw.career || typeof raw.career.month !== "number") return null;
    return raw;
  } catch { return null; }
}

export function clearCareerSnapshot() {
  try { localStorage.removeItem(CAREER_KEY); } catch { /* noop */ }
}
