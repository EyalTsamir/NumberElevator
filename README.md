# מעלית המספרים 🛗 · Number Elevator

משחק לימוד **ציר המספרים** לתלמידי בית הספר היסודי (כיתות א׳–ו׳).
המעלית היא ציר המספרים: עולים קומה־קומה, מגלים את **גודל הקפיצה** וממלאים את הקומות החסרות.

A Hebrew (RTL) browser game that teaches the number line through an elevator metaphor.
Pure static site — **no build step, no dependencies to install** — so it deploys to GitHub
Pages straight from the repository.

---

## איך משחקים (How it plays)

בכל תרגיל יש **שני חלקים**:

1. **מוצאים את הקפיצה** — מביטים בבניין (עם כמה קומות "עוגן" שכבר מסומנות) וכותבים במקלדת המספרים בכמה עולים בכל קפיצה. בתרגילי שברים בוחרים מתוך אפשרויות (קשה להקליד ¼).
2. **משבצים את המספרים** — גוררים כל מספר מהמגש לקומה הריקה שמתאימה לו.

תשובה נכונה → צליל שמח וניקוד. תשובה שגויה → "נסה שוב" (בלי עונש).

### התוכן — לפי כיתות (א׳–ו׳ + הכנה לחטיבה)

כל כיתה כוללת **4 תרגילים**, אחד לכל סוג קפיצה. כל תרגיל הוא "חלון" קטן של ציר המספרים
(כ־5–6 קומות): לפחות שתי קומות נתונות (אפשר גם באמצע), והשאר נגררות. בכל כיתה יש לפחות
**קפיצת עשרת** אחת שחוצה מספר עגול (למשל 90→110 — קשה יותר מ־70→90).

| כיתה | טווח | קפיצות |
|------|------|--------|
| א׳ | עד 100 | 1 · 2 · 5 · 10 |
| ב׳ | עד 1000 | כמו א׳ ועוד 4 |
| ג׳ | עד 10,000 | ועוד 20 · 100 |
| ד׳ | עד מיליון | 200 · 900 · 1000 · 1200 |
| ה׳ | כמו ד׳ | + מספרים עשרוניים ושברים |
| ו׳ | כמו ה׳ | + אחוזים (ציר של %) |
| הכנה לחטיבה | הכול יחד | קפיצות מאתגרות מכל הסוגים |

אין מספרים שליליים. ההתקדמות והכוכבים נשמרים בדפדפן (`localStorage`).

---

## הרצה מקומית (Run locally)

The game uses ES modules, so it must be served over HTTP (opening `index.html` as a
`file://` will not work). Any static server works:

```bash
# Python (built in)
python -m http.server 8000
#   → open http://localhost:8000

# or Node
npx serve
```

VS Code users can also right-click `index.html` → **Open with Live Server**.

---

## פרסום ל-GitHub Pages (Deploy)

```bash
git init
git add .
git commit -m "Number Elevator game"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch →
Branch: `main` / `root` → Save.** After a minute the game is live at
`https://<user>.github.io/<repo>/`. Share that link — no server or configuration needed.

---

## מבנה הפרויקט (Structure)

```
index.html            RTL shell + font links
css/styles.css        design system + all component styles
js/
  main.js             screen router (home / select / game / complete)
  screens.js          home, level-select, level-complete screens
  game.js             one level: runs phase 1 → phase 2, scoring, stars
  levels.js           grades + exercises configuration (7 groups × 4)
  building.js         renders the tower / number line / elevator car
  elevator.js         car placement + door animation
  phaseStep.js        phase 1 — type the floor-to-floor jump (fractions: choose)
  phaseSetup.js       phase 2 — drag the numbers onto their floors
  numbers.js          number-line math + fraction/decimal formatting
  ui.js               DOM helpers + shared widgets
  audio.js            Web-Audio sound effects (no audio files)
  confetti.js         celebration effect
```

**Self-contained:** graphics are CSS/SVG, sounds are synthesized with the Web Audio API,
and there are no image or audio asset files. The one external resource is the Google Fonts
stylesheet (Secular One + Rubik) — if it is ever unavailable the game falls back to system
fonts and keeps working.
