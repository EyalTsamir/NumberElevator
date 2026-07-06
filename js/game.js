// game.js — orchestrates one level: build the tower, run phase 1 (guess the
// increment) then phase 2 (drag the numbers onto the tower), tally score/stars, and finish.

import { h, muteToggle } from './ui.js';
import { getLevel, getType } from './levels.js';
import { recordResult } from './state.js';
import { createBuilding, fitBuilding } from './building.js';
import { createElevator } from './elevator.js';
import { runStep } from './phaseStep.js';
import { runSetup } from './phaseSetup.js';
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
    // shown only when a phone is held sideways (portrait-first game)
    h('div', { class: 'rotate-hint', 'aria-hidden': 'true' },
      h('div', { class: 'rotate-hint__icon' }, '📱'),
      h('p', {}, 'סובבו את הטלפון לאורך כדי לשחק 🙂'),
    ),
  );

  function setPhase(k) {
    screen.classList.remove('phase-1', 'phase-2');
    screen.classList.add('phase-' + k);
    phaseChip.innerHTML = '';
    phaseChip.append(
      h('span', { class: 'phase-chip__step' + (k === 1 ? ' is-active' : ' is-done') }, '1'),
      h('span', { class: 'phase-chip__label' }, k === 1 ? 'כמה עולים בכל קומה?' : 'משבצים מספרים'),
      h('span', { class: 'phase-chip__step' + (k === 2 ? ' is-active' : '') }, '2'),
    );
  }

  const minFloor = 34; // floor badges are drop targets in phase 2, so keep them touch-friendly
  let lastAvail = -1;
  const refit = () => {
    if (!building.el.isConnected) return;
    const cs = getComputedStyle(buildingWrap);
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const avail = Math.round((buildingWrap.clientHeight || 520) - pad);
    if (avail === lastAvail) return; // skip redundant fits / ResizeObserver loops
    lastAvail = avail;
    const { fits } = fitBuilding(building, avail, { minFloor });
    if (!fits) building.scrollToValue(elevator.current()); // re-follow the car once the shaft becomes scrollable
  };
  window.addEventListener('resize', refit);

  // Re-fit whenever the building's available space changes — the bottom dock growing
  // or shrinking per phase, the mobile URL bar toggling, orientation changes, etc.
  const ro = new ResizeObserver(() => refit());
  ro.observe(buildingWrap);

  let rafPending = false;
  const onVVResize = () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; lastAvail = -1; refit(); });
  };
  window.visualViewport?.addEventListener('resize', onVVResize);
  // Re-fit once the display font swaps in (it changes roof/base overhead slightly).
  document.fonts?.ready.then(() => { lastAvail = -1; refit(); });

  requestAnimationFrame(async () => {
    refit();
    elevator.place(0);
    elevator.openDoors();
    setPhase(1);

    await runStep({ level, building, consoleBody, banner, scoreApi });

    setPhase(2);
    await runSetup({ level, building, consoleBody, banner, scoreApi });

    const starCount = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
    recordResult(level.id, starCount, score);
    window.removeEventListener('resize', refit);
    window.visualViewport?.removeEventListener('resize', onVVResize);
    ro.disconnect();
    setTimeout(() => navigate('complete', { levelId: level.id, score, stars: starCount, mistakes }), 750);
  });

  return screen;
}
