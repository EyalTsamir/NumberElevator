// game.js — orchestrates one level: build the tower, run phase 1 (fill the
// number line) then phase 2 (deliver passengers), tally score/stars, and finish.

import { h, muteToggle } from './ui.js';
import { getLevel, getType } from './levels.js';
import { recordResult } from './state.js';
import { createBuilding, fitBuilding } from './building.js';
import { createElevator } from './elevator.js';
import { runSetup } from './phaseSetup.js';
import { runPlay } from './phasePlay.js';
import * as sfx from './audio.js';

export function renderGame({ navigate, params }) {
  const level = getLevel(params.levelId);
  const type = getType(level.type);
  const building = createBuilding(level);
  const elevator = createElevator(building);

  let score = 0;
  let mistakes = 0;

  const scoreEl = h('strong', { class: 'score__val' }, '0');
  const scoreApi = {
    add(n) {
      score += n;
      scoreEl.textContent = String(score);
      scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump');
    },
    get: () => score,
    mistake() { mistakes++; },
  };

  const phaseChip = h('div', { class: 'phase-chip' });
  const banner = h('div', { class: 'banner' });
  const consoleBody = h('div', { class: 'console__body' });

  const buildingWrap = h('div', { class: 'stage__building' }, building.el);
  const stage = h('div', { class: 'stage' },
    buildingWrap,
    h('div', { class: 'console' }, phaseChip, banner, consoleBody),
  );

  const screen = h('div', { class: 'screen game phase-1', style: { '--hue': type.hue } },
    h('div', { class: 'topbar' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'חזרה לתפריט', onClick: () => { sfx.click(); navigate('select'); } }, '→'),
      h('span', { class: 'topbar__title' }, `${type.name} · שלב ${level.level}`),
      h('div', { class: 'score' }, h('span', { class: 'score__cap' }, 'ניקוד'), scoreEl),
      muteToggle(),
    ),
    stage,
  );

  function setPhase(k) {
    screen.classList.remove('phase-1', 'phase-2');
    screen.classList.add('phase-' + k);
    phaseChip.innerHTML = '';
    phaseChip.append(
      h('span', { class: 'phase-chip__step' + (k === 1 ? ' is-active' : ' is-done') }, '1'),
      h('span', { class: 'phase-chip__label' }, k === 1 ? 'בונים את הבניין' : 'מסיעים נוסעים'),
      h('span', { class: 'phase-chip__step' + (k === 2 ? ' is-active' : '') }, '2'),
    );
  }

  const refit = () => { if (building.el.isConnected) fitBuilding(building, buildingWrap.clientHeight || 520); };
  window.addEventListener('resize', refit);

  requestAnimationFrame(async () => {
    refit();
    elevator.place(0);
    setPhase(1);

    await runSetup({ level, building, elevator, consoleBody, banner, scoreApi });

    setPhase(2);
    await runPlay({ level, building, elevator, consoleBody, banner, scoreApi });

    const starCount = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
    recordResult(level.id, starCount, score);
    window.removeEventListener('resize', refit);
    setTimeout(() => navigate('complete', { levelId: level.id, score, stars: starCount, mistakes }), 750);
  });

  return screen;
}
