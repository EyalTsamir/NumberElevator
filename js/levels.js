// levels.js — the game's content. Three types × four levels.
// Basement (negative floors) is introduced gradually at level 3 of each type.

export const TYPES = [
  { id: 'whole',    name: 'מספרים שלמים',      short: 'שלמים',  glyph: '7',  hue: 212 },
  { id: 'fraction', name: 'שברים',              short: 'שברים',  glyph: '½',  hue: 16  },
  { id: 'decimal',  name: 'מספרים עשרוניים',    short: 'עשרוני', glyph: '·',  hue: 145 },
];

// min→max spaced by step defines the floors. anchors are pre-filled in phase 1
// (0 = the ground-floor lobby is always a free reference point).
export const LEVELS = [
  // ---- whole numbers (step 1) ----
  { id: 'whole-1', type: 'whole', level: 1, min: 0,  max: 5, step: 1, anchors: [0, 5], distractors: 0 },
  { id: 'whole-2', type: 'whole', level: 2, min: 0,  max: 8, step: 1, anchors: [0],    distractors: 1 },
  { id: 'whole-3', type: 'whole', level: 3, min: -3, max: 4, step: 1, anchors: [0],    distractors: 1 },
  { id: 'whole-4', type: 'whole', level: 4, min: -4, max: 4, step: 1, anchors: [0],    distractors: 2 },

  // ---- fractions (step ½; level 4 steps by ¼) ----
  { id: 'fraction-1', type: 'fraction', level: 1, min: 0,    max: 2,   step: 0.5,  anchors: [0, 2], distractors: 0 },
  { id: 'fraction-2', type: 'fraction', level: 2, min: 0,    max: 3,   step: 0.5,  anchors: [0],    distractors: 1 },
  { id: 'fraction-3', type: 'fraction', level: 3, min: -1,   max: 2,   step: 0.5,  anchors: [0],    distractors: 1 },
  { id: 'fraction-4', type: 'fraction', level: 4, min: -0.5, max: 1.5, step: 0.25, anchors: [0],    distractors: 2 },

  // ---- decimals (step 0.5; level 4 steps by 0.1) ----
  { id: 'decimal-1', type: 'decimal', level: 1, min: 0,    max: 2,   step: 0.5, anchors: [0, 2], distractors: 0 },
  { id: 'decimal-2', type: 'decimal', level: 2, min: 0,    max: 3,   step: 0.5, anchors: [0],    distractors: 1 },
  { id: 'decimal-3', type: 'decimal', level: 3, min: -1,   max: 2,   step: 0.5, anchors: [0],    distractors: 1 },
  { id: 'decimal-4', type: 'decimal', level: 4, min: -0.2, max: 0.6, step: 0.1, anchors: [0],    distractors: 2 },
];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) || null;
}

export function levelsOfType(typeId) {
  return LEVELS.filter((l) => l.type === typeId).sort((a, b) => a.level - b.level);
}

export function getType(typeId) {
  return TYPES.find((t) => t.id === typeId) || null;
}

/** Next level within the same type, or null after level 4. */
export function nextLevelId(id) {
  const cur = getLevel(id);
  if (!cur) return null;
  const next = LEVELS.find((l) => l.type === cur.type && l.level === cur.level + 1);
  return next ? next.id : null;
}
