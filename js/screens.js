// screens.js — the menu-ish screens: home, level select, and level complete.

import { h, stars, button, muteToggle } from './ui.js';
import { GRADES, exercisesOfGrade, getExercise, getGrade, nextExerciseId } from './levels.js';
import { isUnlocked, starsFor, totalStars, isCompleted } from './state.js';
import * as sfx from './audio.js';
import { confetti } from './confetti.js';

/** Small decorative elevator tower shown on the home screen. */
function miniTower() {
  const tower = h('div', { class: 'mini-tower', 'aria-hidden': 'true' });
  const shaft = h('div', { class: 'mini-shaft' }, h('div', { class: 'mini-car' }, h('span', {}, '▲▼')));
  const rooms = h('div', { class: 'mini-rooms' });
  for (let i = 0; i < 5; i++) rooms.append(h('div', { class: 'mini-room' }, h('span', { class: 'mini-win' })));
  tower.append(h('div', { class: 'mini-roof' }), h('div', { class: 'mini-body' }, rooms, shaft));
  return tower;
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
        h('p', { class: 'home__hint' }, 'לכל כיתה 4 תרגילים · כותבים בכמה עולים בכל קפיצה · וגוררים את המספרים לקומה שלהם'),
      ),
    ),
  );
}

export function renderSelect({ navigate }) {
  const groups = GRADES.map((grade) => {
    const exercises = exercisesOfGrade(grade.id);
    const done = exercises.filter((e) => isCompleted(e.id)).length;
    const cards = exercises.map((ex) => {
      const open = isUnlocked(ex);
      if (!open) {
        return h('div', { class: 'level-card is-locked', 'aria-label': `תרגיל ${ex.index} נעול` },
          h('span', { class: 'level-card__lock' }, '🔒'));
      }
      return h('button', {
        class: 'level-card', type: 'button',
        onClick: () => { sfx.click(); navigate('game', { levelId: ex.id }); },
        'aria-label': `${grade.name}, תרגיל ${ex.index}`,
      },
        h('span', { class: 'level-card__num' }, String(ex.index)),
        stars(starsFor(ex.id)),
      );
    });
    return h('section', { class: 'type-group', style: { '--hue': grade.hue } },
      h('div', { class: 'type-head' },
        h('span', { class: 'type-glyph' }, grade.glyph),
        h('h2', { class: 'type-name' }, grade.name),
        h('span', { class: 'type-progress' }, `${done}/${exercises.length}`),
      ),
      h('div', { class: 'level-row' }, ...cards),
    );
  });

  return h('div', { class: 'screen select' },
    h('div', { class: 'topbar' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'חזרה', onClick: () => { sfx.click(); navigate('home'); } }, '→'),
      h('h1', { class: 'topbar__title' }, 'בחרו שלב'),
      h('span', { class: 'star-count' }, '⭐ ' + totalStars()),
    ),
    h('div', { class: 'select__body' }, ...groups),
  );
}

export function renderComplete({ navigate, params }) {
  const { levelId, score, stars: earned, mistakes } = params;
  const level = getExercise(levelId);
  const grade = getGrade(level.grade);
  const nextId = nextExerciseId(levelId);
  const nextOpen = nextId && isUnlocked(getExercise(nextId));

  const headline = earned >= 3 ? 'מושלם!' : earned === 2 ? 'כל הכבוד!' : 'יפה מאוד!';

  // Celebrate on mount (screen node is appended immediately after this returns).
  setTimeout(() => { sfx.win(); confetti(); }, 60);

  const actions = h('div', { class: 'complete__actions' },
    nextId
      ? button('לתרגיל הבא', () => { sfx.click(); navigate('game', { levelId: nextId }); },
          { variant: nextOpen ? 'accent' : 'ghost', size: 'lg', icon: '➜' })
      : button('סיימתם את הכיתה!', () => { sfx.click(); navigate('select'); }, { variant: 'accent', size: 'lg', icon: '🎉' }),
    button('שוב', () => { sfx.click(); navigate('game', { levelId }); }, { variant: 'primary', icon: '↻' }),
    button('לתפריט', () => { sfx.click(); navigate('select'); }, { variant: 'ghost', icon: '≡' }),
  );

  return h('div', { class: 'screen complete', style: { '--hue': grade.hue } },
    h('div', { class: 'complete__card pop-in' },
      h('div', { class: 'complete__badge' }, '🛗'),
      h('h1', { class: 'complete__title' }, headline),
      h('p', { class: 'complete__sub' }, `${grade.name} · תרגיל ${level.index}`),
      stars(earned),
      h('div', { class: 'complete__score' }, h('span', {}, 'ניקוד'), h('strong', {}, String(score))),
      mistakes === 0 ? h('p', { class: 'complete__perfect' }, 'בלי אף טעות! ⭐') : null,
      actions,
    ),
  );
}
