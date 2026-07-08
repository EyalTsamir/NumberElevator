// game.js — orchestrates one STAGE: its 4 elevators are played back-to-back.
// For each elevator we (re)build the tower, run phase 1 (guess the increment) then
// phase 2 (drag the numbers onto the tower). Score, hearts and streak carry across
// all 4 elevators; stars are tallied once, for the whole stage, at the end.

import { h, muteToggle, fullscreenToggle } from './ui.js';
import { getStage, getGrade } from './levels.js';
import { recordResult } from './state.js';
import { createBuilding, fitBuilding } from './building.js';
import { createElevator } from './elevator.js';
import { runStep } from './phaseStep.js';
import { runSetup } from './phaseSetup.js';
import * as sfx from './audio.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function renderGame({ navigate, params }) {
  const stage = getStage(params.levelId);
  const grade = getGrade(stage.grade);
  const elevators = stage.elevators;

  // Hearts carry across the whole stage (4 elevators ≈ 4× the old length), so the
  // stage gets a bigger, more forgiving pool than a single old exercise did.
  const MAX_HEARTS = 5;
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

  // A brief, kind message that never blocks play (e.g. when the last heart goes).
  function toast(text) {
    const t = h('div', { class: 'toast', role: 'status' }, text);
    screen.append(t);
    setTimeout(() => t.classList.add('is-out'), 2300);
    setTimeout(() => t.remove(), 2800);
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
      // Mark the moment the last heart goes — stars can't drop further, so reassure
      // rather than let it pass silently. Fires exactly once (mistakes can exceed MAX).
      if (mistakes === MAX_HEARTS) toast('נגמרו הלבבות — תמשיכו, אתם עדיין יכולים לסיים! 💪');
    },
  };

  const phaseChip = h('div', { class: 'phase-chip' });
  const banner = h('div', { class: 'banner' });
  const consoleBody = h('div', { class: 'console__body' });

  // Mobile-only: lets the child collapse the whole dock away to see the tower at
  // full height (both anchor floors, uncropped) while working out the jump, then
  // expand it back to type the answer. Purely a `.console.is-collapsed` CSS
  // toggle — the building already grows into freed space via its ResizeObserver
  // (see `refit` below), so no extra sizing logic is needed here.
  let collapsed = false;
  const handleIcon = h('span', { class: 'console__handle-icon', 'aria-hidden': 'true' }, '⌄');
  const handleLabel = h('span', {}, 'הסתירו כדי לראות את כל המעלית');
  const consoleHandle = h('button', {
    class: 'console__handle', type: 'button', 'aria-expanded': 'true',
  }, handleIcon, handleLabel);
  function setCollapsed(next) {
    collapsed = next;
    consoleEl.classList.toggle('is-collapsed', collapsed);
    consoleHandle.setAttribute('aria-expanded', String(!collapsed));
    handleIcon.textContent = collapsed ? '⌃' : '⌄';
    handleLabel.textContent = collapsed ? 'הציגו את המקלדת' : 'הסתירו כדי לראות את כל המעלית';
  }
  consoleHandle.addEventListener('click', () => { sfx.click(); setCollapsed(!collapsed); });

  // A tower is rebuilt for every elevator; the wrapper stays put (ResizeObserver target).
  let building = null;
  let elevator = null;
  const buildingWrap = h('div', { class: 'stage__building' });
  const consoleEl = h('div', { class: 'console' }, consoleHandle, phaseChip, banner, consoleBody);
  const stageEl = h('div', { class: 'stage' }, buildingWrap, consoleEl);

  // Stage progress: one dot per elevator, so the child sees "how many towers left".
  const elevDots = elevators.map(() => h('span', { class: 'elev-dot' }));
  const elevTrack = h('div', { class: 'elev-track', role: 'img', 'aria-label': `מעלית 1 מתוך ${elevators.length}` },
    h('span', { class: 'elev-track__cap' }, '🛗 מעלית'),
    h('div', { class: 'elev-dots' }, ...elevDots),
    h('span', { class: 'elev-track__count' }, `1/${elevators.length}`),
  );
  const titleFull = h('span', { class: 'topbar__title-full' }, `${grade.name} · שלב ${stage.index}`);
  const titleShort = h('span', { class: 'topbar__title-short' }, `${grade.short} · ${stage.index}`);
  function updateElevProgress(idx) {
    elevDots.forEach((d, i) => {
      d.classList.toggle('is-done', i < idx);
      d.classList.toggle('is-active', i === idx);
    });
    elevTrack.querySelector('.elev-track__count').textContent = `${idx + 1}/${elevators.length}`;
    elevTrack.setAttribute('aria-label', `מעלית ${idx + 1} מתוך ${elevators.length}`);
  }

  const screen = h('div', { class: 'screen game phase-1', style: { '--hue': grade.hue } },
    h('div', { class: 'topbar' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'חזרה לתפריט', title: 'חזרה לבחירת שלב', onClick: () => { sfx.click(); navigate('select'); } }, '→'),
      // Full label on roomy screens; a compact "א׳ · 2" form on narrow phones so the
      // stage number never gets ellipsis-clipped. Whichever is shown (the other is
      // display:none) is the one a screen reader reads.
      h('span', { class: 'topbar__title' }, titleFull, titleShort),
      h('div', { class: 'status' }, livesEl, scorePill),
      fullscreenToggle(),
      muteToggle(),
    ),
    elevTrack,
    stageEl,
    // shown only when a phone is held sideways (portrait-first game)
    h('div', { class: 'rotate-hint', 'aria-hidden': 'true' },
      h('div', { class: 'rotate-hint__icon' }, '📱'),
      h('p', {}, 'סובבו את הטלפון לאורך כדי לשחק 🙂'),
    ),
  );

  function setPhase(k) {
    setCollapsed(false); // fresh instructions each phase — never leave the dock hidden across a transition
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
    if (!building?.el.isConnected) return;
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

  // Swap a fresh tower into the shaft for the elevator at `idx`.
  function mountElevator(idx) {
    const level = elevators[idx];
    building = createBuilding(level);
    elevator = createElevator(building);
    building.el.classList.add('is-enter');
    buildingWrap.replaceChildren(building.el);
    requestAnimationFrame(() => building?.el.classList.remove('is-enter'));
    lastAvail = -1;
    refit();
    // Park the car on the lowest given anchor — its readout then shows a number the
    // child already has, never leaking the value of a blank floor (windows rarely include 0).
    elevator.place(Math.min(...level.anchors));
    elevator.openDoors();
    updateElevProgress(idx);
    return level;
  }

  function cleanup() {
    window.removeEventListener('resize', refit);
    window.visualViewport?.removeEventListener('resize', onVVResize);
    ro.disconnect();
  }

  requestAnimationFrame(async () => {
    for (let i = 0; i < elevators.length; i++) {
      const level = mountElevator(i);

      setPhase(1);
      await runStep({ level, building, consoleBody, banner, scoreApi });

      setPhase(2);
      await runSetup({ level, building, consoleBody, banner, scoreApi });

      // A short breath between towers so the swap doesn't feel abrupt.
      if (i < elevators.length - 1) {
        banner.innerHTML = '';
        banner.append(h('strong', { class: 'banner--win' }, `מעלית ${i + 2} מגיעה… 🛗`));
        await wait(700);
      }
    }

    // Stars for the whole stage, from the hearts kept (one clear, visible rule):
    // ≤1 mistake → 3, ≤3 → 2, otherwise 1 (never below 1).
    const hearts = heartsLeft();
    const starCount = hearts >= 4 ? 3 : hearts >= 2 ? 2 : 1;
    // Careful-play reward: a bonus for every heart still full.
    const heartBonus = hearts * 15;
    if (heartBonus) { score += heartBonus; scoreEl.textContent = String(score); }
    recordResult(stage.id, starCount, score);
    cleanup();
    setTimeout(() => navigate('complete', { levelId: stage.id, score, stars: starCount, mistakes, hearts, heartBonus, bestStreak }), 750);
  });

  return screen;
}
