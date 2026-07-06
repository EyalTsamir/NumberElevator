# מעלית המספרים 🛗 · Number Elevator

משחק לימוד **ציר המספרים** לתלמידי בית הספר היסודי (כיתות א׳–ו׳).
המעלית היא ציר המספרים: **קומת הקרקע = 0**, למעלה מספרים חיוביים, ובמרתף מספרים שליליים.

A Hebrew (RTL) browser game that teaches the number line through an elevator metaphor.
Pure static site — **no build step, no dependencies to install** — so it deploys to GitHub
Pages straight from the repository.

---

## איך משחקים (How it plays)

בכל שלב יש **שני חלקים**:

1. **מוצאים את הקפיצה** — מביטים בבניין (עם כמה קומות "עוגן" שכבר מסומנות) ובוחרים מתוך כמה אפשרויות כמה כל קומה שווה.
2. **משבצים את המספרים** — גוררים כל מספר מהמגש לקומה הריקה שמתאימה לו.

תשובה נכונה → צליל שמח וניקוד. תשובה שגויה → "נסה שוב" (בלי עונש).

### התוכן — 3 סוגים × 4 שלבים

| סוג | קפיצה | טווח לדוגמה |
|-----|-------|--------------|
| מספרים שלמים | 1 | 0→5 … ועד ‎−4→4 |
| שברים | ½ (ובשלב 4 ¼) | 0→2 … ועד ‎−½→1½ |
| מספרים עשרוניים | 0.5 (ובשלב 4 0.1) | 0→2 … ועד ‎−0.2→0.6 |

המרתף (מספרים שליליים) נכנס בהדרגה — שלבים 1–2 מעל הקרקע, שלבים 3–4 גם מתחתיה.
ההתקדמות והכוכבים נשמרים בדפדפן (`localStorage`).

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
  levels.js           the 12-level configuration
  building.js         renders the tower / number line / elevator car
  elevator.js         car placement + door animation
  phaseStep.js        phase 1 — guess the floor-to-floor increment
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
