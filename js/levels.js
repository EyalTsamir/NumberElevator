// levels.js — the game's content, organized by school grade (כיתה א׳–ו׳) plus a
// "הכנה לחטיבה" prep group.
//
// HIERARCHY:  grade → 4 STAGES (שלב) → 4 ELEVATORS (מעלית) each.
//   • An ELEVATOR is a small WINDOW of the number line (5–6 floors) with a single
//     jump size: a couple of floors are given (anchors, possibly mid-line), the
//     rest are dragged in.
//   • A STAGE bundles 4 elevators that share a pedagogical theme but each use a
//     DIFFERENT jump (הפרש) — e.g. "reach 100" by 5s, 10s, 20s and 25s. They are
//     played back-to-back in one sitting; stars are earned for the whole stage.
//
// The grade's number cap (≤100, ≤1000, … ≤1,000,000) is the size of the numbers
// the child meets, always shown a window at a time — never one giant tower.
//
// `type` drives number formatting only ('whole' | 'decimal' | 'fraction' | 'percent').
// No negative floors anywhere — the axis starts at 0 and climbs.

import { round } from './numbers.js';

export const GRADES = [
  { id: 'g1',   name: 'כיתה א׳',      short: 'א׳',    glyph: 'א',  hue: 212, blurb: 'שלמים עד 100' },
  { id: 'g2',   name: 'כיתה ב׳',      short: 'ב׳',    glyph: 'ב',  hue: 262, blurb: 'שלמים עד 1000' },
  { id: 'g3',   name: 'כיתה ג׳',      short: 'ג׳',    glyph: 'ג',  hue: 16,  blurb: 'שלמים עד 10,000' },
  { id: 'g4',   name: 'כיתה ד׳',      short: 'ד׳',    glyph: 'ד',  hue: 145, blurb: 'שלמים עד מיליון' },
  { id: 'g5',   name: 'כיתה ה׳',      short: 'ה׳',    glyph: 'ה',  hue: 32,  blurb: 'עשרוני ושברים' },
  { id: 'g6',   name: 'כיתה ו׳',      short: 'ו׳',    glyph: 'ו',  hue: 288, blurb: 'אחוזים ושברים' },
  { id: 'prep', name: 'הכנה לחטיבה',  short: 'חטיבה', glyph: '🎓', hue: 200, blurb: 'הכול ביחד, מאתגר' },
];

const THIRD = 1 / 3; // ⅓ — kept exact-ish; round() below tames the float fuzz
const SIXTH = 1 / 6; // ⅙

/**
 * Build ONE elevator (a number-line window). `floors` floors start at `min` and
 * rise by `step`; the two given (anchor) floors sit at 0-based positions `a`,`b`.
 * max + anchors are derived, so a window can never be internally inconsistent.
 */
function win(type, min, step, distractors = 2, floors = 6, a = 1, b = 4) {
  const at = (i) => round(min + i * step, 6);
  return { type, min: at(0), max: at(floors - 1), step: round(step, 6), anchors: [at(a), at(b)], distractors };
}

// A stage: 4 elevators, 4 different jumps, one theme.
function stage(id, grade, index, theme, elevators) {
  return { id, grade, index, theme, elevators };
}

export const STAGES = [
  // ============================ כיתה א׳ · שלמים עד 100 (distractors 1) =========
  stage('g1-1', 'g1', 1, 'עולים אל 10 וממשיכים', [
    win('whole', 7, 1, 1),           // 7…12   · חוצה 10
    win('whole', 4, 2, 1),           // 4…14   · חוצה 10
    win('whole', 1, 3, 1),           // 1…16   · נוחת על 10
    win('whole', 0, 5, 1, 5, 1, 3),  // 0…20   · נוחת על 10
  ]),
  stage('g1-2', 'g1', 2, 'מגיעים אל 50', [
    win('whole', 44, 2, 1),          // 44…54  · חוצה 50
    win('whole', 38, 3, 1),          // 38…53  · נוחת על 50
    win('whole', 30, 5, 1),          // 30…55  · נוחת על 50
    win('whole', 10, 10, 1),         // 10…60  · נוחת על 50
  ]),
  stage('g1-3', 'g1', 3, 'מטפסים עד 100', [
    win('whole', 75, 5, 1),          // 75…100
    win('whole', 50, 10, 1),         // 50…100
    win('whole', 0, 20, 1),          // 0…100
    win('whole', 0, 25, 1, 5, 1, 3), // 0…100 (4 קפיצות)
  ]),
  stage('g1-4', 'g1', 4, 'קוראים את הציר באמצע', [
    win('whole', 27, 3, 1),          // 27…42
    win('whole', 26, 4, 1),          // 26…46
    win('whole', 35, 5, 1),          // 35…60
    win('whole', 24, 6, 1),          // 24…54
  ]),

  // ============================ כיתה ב׳ · עד 1000 =============================
  stage('g2-1', 'g2', 1, 'חוצים את ה-100', [
    win('whole', 88, 4),             // 88…108 · חוצה 100
    win('whole', 90, 2),             // 90…100 · מגיע ל-100
    win('whole', 80, 5),             // 80…105 · חוצה 100
    win('whole', 60, 10),            // 60…110 · חוצה 100
  ]),
  stage('g2-2', 'g2', 2, 'חוצים את ה-500', [
    win('whole', 480, 5),            // 480…505
    win('whole', 470, 10),           // 470…520
    win('whole', 460, 20),           // 460…560
    win('whole', 450, 25),           // 450…575
  ]),
  stage('g2-3', 'g2', 3, 'מגיעים אל 1000', [
    win('whole', 950, 10),           // 950…1000
    win('whole', 900, 20),           // 900…1000
    win('whole', 750, 50),           // 750…1000
    win('whole', 500, 100),          // 500…1000
  ]),
  stage('g2-4', 'g2', 4, 'חוצים מאות שונות', [
    win('whole', 794, 2),            // 794…804 · חוצה 800
    win('whole', 292, 4),            // 292…312 · חוצה 300
    win('whole', 150, 25),           // 150…275 · חוצה 200
    win('whole', 600, 50),           // 600…850
  ]),

  // ============================ כיתה ג׳ · עד 10,000 ==========================
  stage('g3-1', 'g3', 1, 'חוצים את ה-1000', [
    win('whole', 985, 5),            // 985…1010
    win('whole', 970, 10),           // 970…1020
    win('whole', 940, 20),           // 940…1040
    win('whole', 850, 50),           // 850…1100
  ]),
  stage('g3-2', 'g3', 2, 'סביב 2000 ו-5000', [
    win('whole', 1985, 5),           // 1985…2010 · חוצה 2000
    win('whole', 4970, 10),          // 4970…5020 · חוצה 5000
    win('whole', 1950, 25),          // 1950…2075 · חוצה 2000
    win('whole', 4850, 50),          // 4850…5100 · חוצה 5000
  ]),
  stage('g3-3', 'g3', 3, 'מטפסים אל 10,000', [
    win('whole', 9500, 100),         // 9500…10000
    win('whole', 9900, 20),          // 9900…10000
    win('whole', 9000, 200),         // 9000…10000
    win('whole', 7500, 500),         // 7500…10000
  ]),
  stage('g3-4', 'g3', 4, 'עשרות ומאות', [
    win('whole', 90, 20),            // 90…190 · חוצה 100
    win('whole', 2920, 40),          // 2920…3120 · חוצה 3000
    win('whole', 3500, 100),         // 3500…4000
    win('whole', 3250, 250),         // 3250…4500 · חוצה 4000
  ]),

  // ============================ כיתה ד׳ · עד מיליון ==========================
  stage('g4-1', 'g4', 1, 'חוצים את ה-10,000', [
    win('whole', 9600, 200),         // 9600…10600
    win('whole', 9700, 100),         // 9700…10200
    win('whole', 9250, 250),         // 9250…10500
    win('whole', 8500, 500),         // 8500…11000
  ]),
  stage('g4-2', 'g4', 2, 'קפיצות לא עגולות', [
    win('whole', 6400, 900),         // 6400…10900 · נוחת על 10000
    win('whole', 6000, 1200),        // 6000…12000
    win('whole', 7000, 600),         // 7000…10000
    win('whole', 6250, 750),         // 6250…10000
  ]),
  stage('g4-3', 'g4', 3, 'חוצים את ה-100,000', [
    win('whole', 97000, 1000),       // 97000…102000
    win('whole', 94000, 2000),       // 94000…104000
    win('whole', 85000, 5000),       // 85000…110000
    win('whole', 92500, 2500),       // 92500…105000
  ]),
  stage('g4-4', 'g4', 4, 'מגיעים אל מיליון', [
    win('whole', 997000, 1000),      // …1,000,000
    win('whole', 975000, 5000),      // 975000…1,000,000
    win('whole', 950000, 10000),     // 950000…1,000,000
    win('whole', 875000, 25000),     // 875000…1,000,000
  ]),

  // ============================ כיתה ה׳ · עשרוני ושברים ======================
  stage('g5-1', 'g5', 1, 'שלמים גדולים', [
    win('whole', 9500, 250),         // 9500…10750
    win('whole', 9700, 100),         // 9700…10200
    win('whole', 9000, 500),         // 9000…11500
    win('whole', 7000, 1000),        // 7000…12000
  ]),
  stage('g5-2', 'g5', 2, 'עשרונים חוצים את השלם', [
    win('decimal', 8.5, 0.5),        // 8.5…11 · חוצה 10
    win('decimal', 2.5, 0.25),       // 2.5…3.75 · חוצה 3
    win('decimal', 4.4, 0.2),        // 4.4…5.4 · חוצה 5
    win('decimal', 4.7, 0.1),        // 4.7…5.2 · חוצה 5
  ]),
  stage('g5-3', 'g5', 3, 'שברים — רבעים וחצאים', [
    win('fraction', 0.5, 0.25),      // ½…1¾ · חוצה 1
    win('fraction', 0.5, 0.5),       // ½…3
    win('fraction', 0.75, 0.75),     // ¾…4½
    win('fraction', THIRD, THIRD),   // ⅓…2 · שלישים
  ]),
  stage('g5-4', 'g5', 4, 'עשרוני ושבר — מעורב', [
    win('decimal', 1.7, 0.1),        // 1.7…2.2 · חוצה 2
    win('decimal', 0.4, 0.2),        // 0.4…1.4 · חוצה 1
    win('fraction', 1.5, 0.25),      // 1½…2¾ · חוצה 2
    win('fraction', 1, 0.5),         // 1…3½
  ]),

  // ============================ כיתה ו׳ · אחוזים ושברים ======================
  stage('g6-1', 'g6', 1, 'אחוזים עד 100%', [
    win('percent', 0, 25, 2, 5, 1, 3), // 0…100%
    win('percent', 0, 10),             // 0…50%
    win('percent', 0, 20),             // 0…100%
    win('percent', 75, 5),             // 75…100%
  ]),
  stage('g6-2', 'g6', 2, 'עשרונים', [
    win('decimal', 0.5, 0.25),       // 0.5…1.75 · חוצה 1
    win('decimal', 1.5, 0.5),        // 1.5…4
    win('decimal', 2.6, 0.1),        // 2.6…3.1 · חוצה 3
    win('decimal', 3.4, 0.2),        // 3.4…4.4 · חוצה 4
  ]),
  stage('g6-3', 'g6', 3, 'שברים', [
    win('fraction', 2, 0.5),         // 2…4½
    win('fraction', 0.5, 0.25),      // ½…1¾ · חוצה 1
    win('fraction', 0.75, 0.75),     // ¾…4½
    win('fraction', THIRD, THIRD),   // ⅓…2 · שלישים
  ]),
  stage('g6-4', 'g6', 4, 'אחוז, עשרוני ושבר', [
    win('percent', 10, 15),          // 10…85% · קפיצה לא-עגולה
    win('decimal', 9.6, 0.2),        // 9.6…10.6 · חוצה 10
    win('fraction', 2.75, 0.25),     // 2¾…4 · חוצה 3
    win('fraction', 1.5, 0.5),       // 1½…4
  ]),

  // ============================ הכנה לחטיבה · הכול ביחד =======================
  stage('prep-1', 'prep', 1, 'מספרים ענקיים', [
    win('whole', 95500, 1500),       // …100000 · חוצה 100000
    win('whole', 97500, 2500),       // …110000 · חוצה 100000
    win('whole', 94000, 3000),       // …109000 · חוצה 100000
    win('whole', 96250, 1250),       // …102500 · חוצה 100000
  ]),
  stage('prep-2', 'prep', 2, 'עשרונים מדויקים', [
    win('decimal', 9.75, 0.25),      // 9.75…11 · חוצה 10
    win('decimal', 2.85, 0.05),      // 2.85…3.1 · חוצה 3
    win('decimal', 9.6, 0.1),        // 9.6…10.1 · חוצה 10
    win('decimal', 4.4, 0.2),        // 4.4…5.4 · חוצה 5
  ]),
  stage('prep-3', 'prep', 3, 'שברים מאתגרים', [
    win('fraction', 2.75, 0.25),     // 2¾…4 · חוצה 3
    win('fraction', THIRD, THIRD),   // ⅓…2 · שלישים
    win('fraction', SIXTH, SIXTH),   // ⅙…1 · שישיות
    win('fraction', 0.5, 0.5),       // ½…3
  ]),
  stage('prep-4', 'prep', 4, 'אלופים: הכול ביחד', [
    win('percent', 25, 15),          // 25…100% · אחוז לא-עגול
    win('whole', 6250, 750),         // 6250…10000
    win('decimal', 9.7, 0.15),       // 9.7…10.45 · חוצה 10
    win('fraction', THIRD, THIRD),   // ⅓…2 · שלישים
  ]),
];

export function getStage(id) {
  return STAGES.find((s) => s.id === id) || null;
}

export function stagesOfGrade(gradeId) {
  return STAGES.filter((s) => s.grade === gradeId).sort((a, b) => a.index - b.index);
}

export function getGrade(gradeId) {
  return GRADES.find((g) => g.id === gradeId) || null;
}

/** Next stage within the same grade, or null after the 4th. */
export function nextStageId(id) {
  const cur = getStage(id);
  if (!cur) return null;
  const next = STAGES.find((s) => s.grade === cur.grade && s.index === cur.index + 1);
  return next ? next.id : null;
}
