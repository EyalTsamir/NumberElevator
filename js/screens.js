// screens.js — the menu-ish screens: home, level select, and level complete.

import { h, stars, button, muteToggle } from './ui.js';
import { GRADES, stagesOfGrade, getStage, getGrade, nextStageId } from './levels.js';
import { isUnlocked, starsFor, totalStars, isCompleted } from './state.js';
import { createBuilding } from './building.js';
import { createElevator } from './elevator.js';
import * as sfx from './audio.js';
import { confetti } from './confetti.js';

/** A small "coming up" preview of a locked stage — its theme, to build anticipation. */
function lockPeek(st) {
  return h('span', { class: 'level-card__peek', 'aria-hidden': 'true' },
    h('span', { class: 'level-card__peek-cap' }, 'בקרוב'),
    h('span', { class: 'level-card__peek-theme' }, st.theme));
}

/**
 * Decorative elevator tower for the home screen — the REAL building component (so
 * the first impression matches the in-game craft), with every floor filled and the
 * car riding gently up and down. The loop stops itself once the node leaves the DOM.
 */
function miniTower() {
  const level = { id: 'home', type: 'whole', min: 1, max: 5, step: 1, anchors: [], distractors: 0 };
  const building = createBuilding(level);
  const elevator = createElevator(building);
  building.el.classList.add('mini-building');
  building.el.setAttribute('aria-hidden', 'true');

  for (let v = level.min; v <= level.max; v++) building.fillFloor(v, { locked: true });
  building.el.style.setProperty('--floor-h', '34px'); // compact; 5 short floors, no scroll
  building.shaft.classList.remove('is-scroll');
  elevator.place(level.min);
  elevator.openDoors();

  let cur = level.min, dir = 1;
  const timer = setInterval(() => {
    if (!building.el.isConnected) { clearInterval(timer); return; }
    cur += dir;
    if (cur >= level.max) dir = -1;
    else if (cur <= level.min) dir = 1;
    elevator.place(cur);
  }, 1500);

  return h('div', { class: 'home__tower', 'aria-hidden': 'true' }, building.el);
}

export function renderHome({ navigate }) {
  return h('div', { class: 'screen home' },
    h('div', { class: 'topbar' }, h('span', { class: 'star-count' }, '⭐ ' + totalStars()), muteToggle()),
    h('div', { class: 'home__hero' },
      miniTower(),
      h('div', { class: 'home__copy' },
        h('h1', { class: 'title' }, 'מעלית המספרים'),
        h('p', { class: 'subtitle' }, 'טפסו בציר המספרים — גלו את גודל הקפיצה ומלאו את הקומות החסרות!'),
        button('בואו נשחק', () => { sfx.click(); navigate('select'); }, { variant: 'accent', size: 'lg', icon: '🛗' }),
        h('p', { class: 'home__hint' }, 'לכל כיתה 4 שלבים · בכל שלב 4 מעליות · כותבים בכמה עולים בכל קפיצה וגוררים כל מספר לקומה שלו'),
      ),
    ),
  );
}

export function renderSelect({ navigate }) {
  const groups = GRADES.map((grade) => {
    const stages = stagesOfGrade(grade.id);
    const done = stages.filter((s) => isCompleted(s.id)).length;
    const cards = stages.map((st) => {
      const open = isUnlocked(st);
      if (!open) {
        return h('div', {
          class: 'level-card is-locked',
          'aria-label': `שלב ${st.index} נעול · ${st.theme}`,
        },
          h('span', { class: 'level-card__lock' }, '🔒'),
          lockPeek(st));
      }
      return h('button', {
        class: 'level-card', type: 'button',
        onClick: () => { sfx.click(); navigate('game', { levelId: st.id }); },
        'aria-label': `${grade.name}, שלב ${st.index} — ${st.theme}`,
      },
        h('span', { class: 'level-card__num' }, String(st.index)),
        stars(starsFor(st.id)),
        h('span', { class: 'level-card__theme' }, st.theme),
      );
    });
    return h('section', { class: 'type-group', style: { '--hue': grade.hue } },
      h('div', { class: 'type-head' },
        h('span', { class: 'type-glyph', 'aria-hidden': 'true' }, grade.glyph),
        h('div', { class: 'type-titles' },
          h('h2', { class: 'type-name' }, grade.name),
          h('span', { class: 'type-blurb' }, grade.blurb),
        ),
        h('span', { class: 'type-progress', 'aria-label': `${done} מתוך ${stages.length} הושלמו` }, `${done}/${stages.length}`),
      ),
      h('div', { class: 'level-row' }, ...cards),
    );
  });

  return h('div', { class: 'screen select' },
    h('div', { class: 'topbar' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'חזרה', title: 'חזרה לדף הבית', onClick: () => { sfx.click(); navigate('home'); } }, '→'),
      h('h1', { class: 'topbar__title' }, 'בחרו שלב'),
      h('span', { class: 'star-count' }, '⭐ ' + totalStars()),
    ),
    h('div', { class: 'select__body' }, ...groups),
  );
}

export function renderComplete({ navigate, params }) {
  const { levelId, score, stars: earned, mistakes, heartBonus = 0, bestStreak = 0 } = params;
  const stage = getStage(levelId);
  const grade = getGrade(stage.grade);
  const nextId = nextStageId(levelId);
  const nextOpen = nextId && isUnlocked(getStage(nextId));

  const headline = earned >= 3 ? 'מושלם!' : earned === 2 ? 'כל הכבוד!' : 'יפה מאוד!';

  // Celebrate on mount (screen node is appended immediately after this returns).
  // Tint the confetti to this grade's hue so it matches the level just finished.
  setTimeout(() => { sfx.win(); confetti({ hue: grade.hue }); }, 60);

  const actions = h('div', { class: 'complete__actions' },
    nextId
      ? button('לשלב הבא', () => { sfx.click(); navigate('game', { levelId: nextId }); },
          { variant: nextOpen ? 'accent' : 'ghost', size: 'lg', icon: '➜' })
      : button('סיימתם את הכיתה!', () => { sfx.click(); navigate('select'); }, { variant: 'accent', size: 'lg', icon: '🎉' }),
    button('שוב', () => { sfx.click(); navigate('game', { levelId }); }, { variant: 'primary', icon: '↻' }),
    button('לתפריט', () => { sfx.click(); navigate('select'); }, { variant: 'ghost', icon: '≡' }),
  );

  return h('div', { class: 'screen complete', style: { '--hue': grade.hue } },
    h('div', { class: 'complete__card pop-in' },
      h('div', { class: 'complete__badge' }, '🛗'),
      h('h1', { class: 'complete__title' }, headline),
      h('p', { class: 'complete__sub' }, `${grade.name} · שלב ${stage.index} · ${stage.theme}`),
      stars(earned),
      h('div', { class: 'complete__score' }, h('span', {}, 'ניקוד'), h('strong', {}, String(score))),
      h('div', { class: 'complete__notes' },
        mistakes === 0 ? h('span', { class: 'complete__note complete__note--good' }, 'בלי אף טעות! ⭐') : null,
        bestStreak >= 3 ? h('span', { class: 'complete__note complete__note--streak' }, `🔥 רצף שיא ×${bestStreak}`) : null,
        heartBonus > 0 ? h('span', { class: 'complete__note complete__note--heart' }, `❤️ בונוס לבבות +${heartBonus}`) : null,
      ),
      actions,
    ),
  );
}
