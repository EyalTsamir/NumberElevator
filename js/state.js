// state.js — persistent player progress (stars, best scores, mute) in localStorage.

const KEY = 'number-elevator/v1';

const store = {
  muted: false,
  progress: {}, // progress[levelId] = { stars: 0-3, score: number }
};

load();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) Object.assign(store, JSON.parse(raw));
  } catch (_) { /* first run / private mode — ignore */ }
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch (_) { /* storage unavailable — game still playable this session */ }
}

// --- audio preference ---
export function isMuted() { return store.muted; }
export function toggleMuted() { store.muted = !store.muted; save(); return store.muted; }

// --- progress ---
export function resultFor(levelId) { return store.progress[levelId] || null; }
export function starsFor(levelId) { return store.progress[levelId]?.stars || 0; }
export function isCompleted(levelId) { return !!store.progress[levelId]; }

/** Save a level result, keeping the best stars/score seen. */
export function recordResult(levelId, stars, score) {
  const prev = store.progress[levelId];
  const bestStars = Math.max(stars, prev?.stars || 0);
  const bestScore = Math.max(score, prev?.score || 0);
  store.progress[levelId] = { stars: bestStars, score: bestScore };
  save();
}

/** Level 1 of every type is open; later levels need the previous one cleared. */
export function isUnlocked(level) {
  if (level.level === 1) return true;
  return isCompleted(`${level.type}-${level.level - 1}`);
}

export function totalStars() {
  return Object.values(store.progress).reduce((s, r) => s + (r.stars || 0), 0);
}

export function bestScoreTotal() {
  return Object.values(store.progress).reduce((s, r) => s + (r.score || 0), 0);
}
