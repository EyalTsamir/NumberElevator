// levels.js — the game's content, organized by school grade (כיתה א׳–ו׳) plus a
// "הכנה לחטיבה" prep group. Each grade holds 4 exercises, one per jump size.
//
// An exercise is a small WINDOW of the number line (~5–6 floors): a couple of
// floors are given (anchors, possibly mid-line), the rest are dragged in. The
// grade's number cap (≤100, ≤1000, … ≤1,000,000) is the size of the numbers the
// child meets, shown a window at a time — never one giant tower.
//
// `type` drives number formatting only ('whole' | 'decimal' | 'fraction' | 'percent').
// No negative floors anywhere — the axis starts at 0 and climbs.

export const GRADES = [
  { id: 'g1',   name: 'כיתה א׳',      short: 'א׳',    glyph: 'א',  hue: 212 },
  { id: 'g2',   name: 'כיתה ב׳',      short: 'ב׳',    glyph: 'ב',  hue: 262 },
  { id: 'g3',   name: 'כיתה ג׳',      short: 'ג׳',    glyph: 'ג',  hue: 16  },
  { id: 'g4',   name: 'כיתה ד׳',      short: 'ד׳',    glyph: 'ד',  hue: 145 },
  { id: 'g5',   name: 'כיתה ה׳',      short: 'ה׳',    glyph: 'ה',  hue: 32  },
  { id: 'g6',   name: 'כיתה ו׳',      short: 'ו׳',    glyph: 'ו',  hue: 288 },
  { id: 'prep', name: 'הכנה לחטיבה',  short: 'חטיבה', glyph: '🎓', hue: 200 },
];

// Floors = rangeFloors(min, max, step). anchors are the given floors (≥2, may be
// interior). distractors = how many just-outside-the-window wrong tiles appear.
export const EXERCISES = [
  // ---- כיתה א׳ · שלמים עד 100 · קפיצות 1 · 2 · 5 · 10 ----
  { id: 'g1-1', grade: 'g1', index: 1, type: 'whole', min: 7,  max: 12,  step: 1,  anchors: [8, 11],   distractors: 1 }, // חוצה 10
  { id: 'g1-2', grade: 'g1', index: 2, type: 'whole', min: 46, max: 56,  step: 2,  anchors: [48, 54],  distractors: 1 }, // חוצה 50
  { id: 'g1-3', grade: 'g1', index: 3, type: 'whole', min: 75, max: 100, step: 5,  anchors: [80, 95],  distractors: 1 }, // מגיע ל-100
  { id: 'g1-4', grade: 'g1', index: 4, type: 'whole', min: 40, max: 90,  step: 10, anchors: [50, 80],  distractors: 1 }, // עשרות

  // ---- כיתה ב׳ · עד 1000 · כמו א׳ ועוד 4 ----
  { id: 'g2-1', grade: 'g2', index: 1, type: 'whole', min: 88,  max: 108,  step: 4,  anchors: [92, 104],  distractors: 2 }, // קפיצת 4, חוצה 100
  { id: 'g2-2', grade: 'g2', index: 2, type: 'whole', min: 480, max: 505,  step: 5,  anchors: [485, 500], distractors: 2 }, // חוצה 500
  { id: 'g2-3', grade: 'g2', index: 3, type: 'whole', min: 950, max: 1000, step: 10, anchors: [960, 990], distractors: 2 }, // מגיע ל-1000
  { id: 'g2-4', grade: 'g2', index: 4, type: 'whole', min: 794, max: 804,  step: 2,  anchors: [796, 802], distractors: 2 }, // חוצה 800

  // ---- כיתה ג׳ · עד 10000 · ועוד 20 · 100 ----
  { id: 'g3-1', grade: 'g3', index: 1, type: 'whole', min: 90,   max: 190,   step: 20,  anchors: [110, 150],   distractors: 2 }, // 90→110 חוצה 100
  { id: 'g3-2', grade: 'g3', index: 2, type: 'whole', min: 9500, max: 10000, step: 100, anchors: [9600, 9900], distractors: 2 }, // מגיע ל-10000
  { id: 'g3-3', grade: 'g3', index: 3, type: 'whole', min: 4970, max: 5020,  step: 10,  anchors: [4980, 5010], distractors: 2 }, // חוצה 5000
  { id: 'g3-4', grade: 'g3', index: 4, type: 'whole', min: 1985, max: 2010,  step: 5,   anchors: [1990, 2005], distractors: 2 }, // חוצה 2000

  // ---- כיתה ד׳ · עד מיליון · קפיצות 200 · 900 · 1000 · 1200 ----
  { id: 'g4-1', grade: 'g4', index: 1, type: 'whole', min: 997000, max: 1002000, step: 1000, anchors: [998000, 1001000], distractors: 2 }, // חוצה מיליון
  { id: 'g4-2', grade: 'g4', index: 2, type: 'whole', min: 9600,   max: 10600,   step: 200,  anchors: [9800, 10400],    distractors: 2 }, // חוצה 10000
  { id: 'g4-3', grade: 'g4', index: 3, type: 'whole', min: 6000,   max: 12000,   step: 1200, anchors: [7200, 10800],    distractors: 2 }, // חוצה 10000
  { id: 'g4-4', grade: 'g4', index: 4, type: 'whole', min: 6400,   max: 10900,   step: 900,  anchors: [7300, 10000],    distractors: 2 }, // חוצה 10000

  // ---- כיתה ה׳ · כמו ד׳ + עשרוני ושברים ----
  { id: 'g5-1', grade: 'g5', index: 1, type: 'whole',    min: 9500, max: 10750, step: 250,  anchors: [9750, 10500], distractors: 2 }, // חוצה 10000
  { id: 'g5-2', grade: 'g5', index: 2, type: 'decimal',  min: 8.5,  max: 11,    step: 0.5,  anchors: [9, 10.5],     distractors: 2 }, // חוצה 10
  { id: 'g5-3', grade: 'g5', index: 3, type: 'decimal',  min: 4.7,  max: 5.2,   step: 0.1,  anchors: [4.8, 5.1],    distractors: 2 }, // חוצה 5
  { id: 'g5-4', grade: 'g5', index: 4, type: 'fraction', min: 0.5,  max: 1.75,  step: 0.25, anchors: [0.75, 1.5],   distractors: 2 }, // ¼, חוצה 1

  // ---- כיתה ו׳ · כמו ה׳ + אחוזים ----
  { id: 'g6-1', grade: 'g6', index: 1, type: 'percent',  min: 0,   max: 50,   step: 10,   anchors: [10, 40],   distractors: 2 }, // ציר אחוזים
  { id: 'g6-2', grade: 'g6', index: 2, type: 'percent',  min: 0,   max: 100,  step: 25,   anchors: [25, 75],   distractors: 2 }, // מגיע ל-100%
  { id: 'g6-3', grade: 'g6', index: 3, type: 'decimal',  min: 0.5, max: 1.75, step: 0.25, anchors: [0.75, 1.5], distractors: 2 }, // חוצה 1
  { id: 'g6-4', grade: 'g6', index: 4, type: 'fraction', min: 2,   max: 4.5,  step: 0.5,  anchors: [2.5, 4],   distractors: 2 }, // ½

  // ---- הכנה לחטיבה · הכול ביחד, מאתגר ----
  { id: 'prep-1', grade: 'prep', index: 1, type: 'whole',    min: 95500, max: 103000, step: 1500, anchors: [97000, 101500], distractors: 2 }, // חוצה 100000
  { id: 'prep-2', grade: 'prep', index: 2, type: 'decimal',  min: 9.5,   max: 10.75,  step: 0.25, anchors: [9.75, 10.5],    distractors: 2 }, // חוצה 10
  { id: 'prep-3', grade: 'prep', index: 3, type: 'fraction', min: 2.75,  max: 4,      step: 0.25, anchors: [3, 3.75],       distractors: 2 }, // ¼, חוצה 3
  { id: 'prep-4', grade: 'prep', index: 4, type: 'percent',  min: 25,    max: 100,    step: 15,   anchors: [40, 85],        distractors: 2 }, // קפיצת אחוז לא-עגולה
];

export function getExercise(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}

export function exercisesOfGrade(gradeId) {
  return EXERCISES.filter((e) => e.grade === gradeId).sort((a, b) => a.index - b.index);
}

export function getGrade(gradeId) {
  return GRADES.find((g) => g.id === gradeId) || null;
}

/** Next exercise within the same grade, or null after the 4th. */
export function nextExerciseId(id) {
  const cur = getExercise(id);
  if (!cur) return null;
  const next = EXERCISES.find((e) => e.grade === cur.grade && e.index === cur.index + 1);
  return next ? next.id : null;
}
