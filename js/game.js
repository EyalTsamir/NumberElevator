// game.js — orchestrates one level: build the tower, run phase 1 (guess the
// increment) then phase 2 (drag the numbers onto the tower), tally score/stars, and finish.

import { h, muteToggle } from './ui.js';
import { getExercise, getGrade } from './levels.js';
import { recordResult } from './state.js';
import { createBuilding, fitBuilding } from './building.js';
import { createElevator } from './elevator.js';
import { runStep } from './phaseStep.js';
import { runSetup } from './phaseSetup.js';
import * as sfx from './audio.js';

export function renderGame({ navigate, params }) {
  const level = getExercise(params.levelId);
  const grade = getGrade(level.grade);
  const building = createBuilding(level);
  const elevator = createElevator(building);

  const MAX_HEARTS = 3;
  let score = 0;
  let mistakes = 0;
  let streak = 0;      // correct answers in a row — drives the reward bonus
  let bestStreak = 0;
  const heartsLeft = () => MAX_HEARTS - Math.min(mistakes, MAX_HEARTS);

  const scoreEl = h('strong', { class: 'score__val' }, '0');
  const scorePill = h('div', { class: 'score' }, h('span', { class: 'score__cap' }, 'ניקוד'), scoreEl);

  // Hearts (lives): visible stakes. A mistake softly spends one; they never block play.
  const heartEls = [];
  const livesEl = h('div', { class: 'lives', role: 'img', 'aria-label': `${MAX_HEARTS} חיים` });
  for (let i = 0; i < MAX_HEARTS; i++) {
    const heart = h('span', { class: 'life', 'aria-hidden': 'true' }, '❤️');
    heartEls.push(heart);
    livesEl.append(heart);
  }

  const bumpScore = () => { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); };
  function floatGain(text, hot) {
    const pop = h('span', { class: 'gain-pop' + (hot ? ' gain-pop--hot' : '') }, text);
    scorePill.append(pop);
    setTimeout(() => pop.remove(), 850);
  }

  const scoreApi = {
    // A correct answer: award the base points plus a streak bonus, and celebrate.
    correct(base) {
      streak++;
      if (streak > bestStreak) bestStreak = streak;
      const hot = streak >= 2;
      const gained = base + (hot ? (streak - 1) * 5 : 0);
      score += gained;
      scoreEl.textContent = String(score);
      bumpScore();
      floatGain(hot ? `+${gained} 🔥×${streak}` : `+${gained}`, hot);
      if (hot) sfx.combo(streak);
    },
    get: () => score,
    // A mistake: break the streak (the gentle penalty) and spend a heart.
    mistake() {
      mistakes++;
      streak = 0;
      const heart = heartEls[MAX_HEARTS - mistakes];
      if (heart && !heart.classList.contains('is-lost')) {
        heart.classList.add('losing');
        livesEl.classList.remove('lives--nudge'); void livesEl.offsetWidth; livesEl.classList.add('lives--nudge');
        setTimeout(() => { heart.classList.remove('losing'); heart.classList.add('is-lost'); }, 400);
      }
    },
  };

  const phaseChip = h('div', { class: 'phase-chip' });
  const banner = h('div', { class: 'banner' });
  const consoleBody = h('div', { class: 'console__body' });

  const buildingWrap = h('div', { class: 'stage__building' }, building.el);
  const stage = h('div', { class: 'stage' },
    buildingWrap,
    h('div', { class: 'console' }, phaseChip, banner, consoleBody),
  );

  const screen = h('div', { class: 'screen game phase-1', style: { '--hue': grade.hue } },
    h('div', { class: 'topbar' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'חזרה לתפריט', onClick: () => { sfx.click(); navigate('select'); } }, '→'),
      h('span', { class: 'topbar__title' }, `${grade.name} · תרגיל ${level.index}`),
      h('div', { class: 'status' }, livesEl, scorePill),
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
      h('span', { class: 'phase-chip__label' }, k === 1 ? 'בכמה עולים בכל קומה?' : 'משבצים מספרים'),
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
    // Park the car on the lowest given anchor — its readout then shows a number the
    // child already has, never leaking the value of a blank floor (windows rarely include 0).
    elevator.place(Math.min(...level.anchors));
    elevator.openDoors();
    setPhase(1);

    await runStep({ level, building, consoleBody, banner, scoreApi });

    setPhase(2);
    await runSetup({ level, building, consoleBody, banner, scoreApi });

    // Stars simply mirror the hearts kept — one clear, visible rule (always ≥1).
    const hearts = heartsLeft();
    const starCount = Math.max(1, hearts);
    // Careful-play reward: a bonus for every heart still full.
    const heartBonus = hearts * 15;
    if (heartBonus) { score += heartBonus; scoreEl.textContent = String(score); }
    recordResult(level.id, starCount, score);
    window.removeEventListener('resize', refit);
    window.visualViewport?.removeEventListener('resize', onVVResize);
    ro.disconnect();
    setTimeout(() => navigate('complete', { levelId: level.id, score, stars: starCount, mistakes, hearts, heartBonus, bestStreak }), 750);
  });

  return screen;
}
