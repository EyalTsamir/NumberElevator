// screens.js — the menu-ish screens: home, level select, and level complete.

import { h, stars, button, muteToggle } from './ui.js';
import { TYPES, levelsOfType, getLevel, getType, nextLevelId } from './levels.js';
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
        h('p', { class: 'subtitle' }, 'עלו וירדו בציר המספרים — גלו את הקפיצה ושבצו את הקומות!'),
        button('בואו נשחק', () => { sfx.click(); navigate('select'); }, { variant: 'accent', size: 'lg', icon: '🛗' }),
        h('p', { class: 'home__hint' }, 'קומת הקרקע היא 0 · למעלה מספרים חיוביים · במרתף מספרים שליליים'),
      ),
    ),
  );
}

export function renderSelect({ navigate }) {
  const groups = TYPES.map((type) => {
    const levels = levelsOfType(type.id);
    const done = levels.filter((l) => isCompleted(l.id)).length;
    const cards = levels.map((lvl) => {
      const open = isUnlocked(lvl);
      if (!open) {
        return h('div', { class: 'level-card is-locked', 'aria-label': `שלב ${lvl.level} נעול` },
          h('span', { class: 'level-card__lock' }, '🔒'));
      }
      return h('button', {
        class: 'level-card', type: 'button',
        onClick: () => { sfx.click(); navigate('game', { levelId: lvl.id }); },
        'aria-label': `${type.name}, שלב ${lvl.level}`,
      },
        h('span', { class: 'level-card__num' }, String(lvl.level)),
        stars(starsFor(lvl.id)),
      );
    });
    return h('section', { class: 'type-group', style: { '--hue': type.hue } },
      h('div', { class: 'type-head' },
        h('span', { class: 'type-glyph' }, type.glyph),
        h('h2', { class: 'type-name' }, type.name),
        h('span', { class: 'type-progress' }, `${done}/${levels.length}`),
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
  const level = getLevel(levelId);
  const type = getType(level.type);
  const nextId = nextLevelId(levelId);
  const nextOpen = nextId && isUnlocked(getLevel(nextId));

  const headline = earned >= 3 ? 'מושלם!' : earned === 2 ? 'כל הכבוד!' : 'יפה מאוד!';

  // Celebrate on mount (screen node is appended immediately after this returns).
  setTimeout(() => { sfx.win(); confetti(); }, 60);

  const actions = h('div', { class: 'complete__actions' },
    nextId
      ? button('לשלב הבא', () => { sfx.click(); navigate('game', { levelId: nextId }); },
          { variant: nextOpen ? 'accent' : 'ghost', size: 'lg', icon: '➜' })
      : button('סיימתם את הסוג!', () => { sfx.click(); navigate('select'); }, { variant: 'accent', size: 'lg', icon: '🎉' }),
    button('שוב', () => { sfx.click(); navigate('game', { levelId }); }, { variant: 'primary', icon: '↻' }),
    button('לתפריט', () => { sfx.click(); navigate('select'); }, { variant: 'ghost', icon: '≡' }),
  );

  return h('div', { class: 'screen complete', style: { '--hue': type.hue } },
    h('div', { class: 'complete__card pop-in' },
      h('div', { class: 'complete__badge' }, '🛗'),
      h('h1', { class: 'complete__title' }, headline),
      h('p', { class: 'complete__sub' }, `${type.name} · שלב ${level.level}`),
      stars(earned),
      h('div', { class: 'complete__score' }, h('span', {}, 'ניקוד'), h('strong', {}, String(score))),
      mistakes === 0 ? h('p', { class: 'complete__perfect' }, 'בלי אף טעות! ⭐') : null,
      actions,
    ),
  );
}
