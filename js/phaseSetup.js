// phaseSetup.js — Phase 1: build the number line by placing every floor label.
// Tap a number tile, then tap the floor it belongs to. Wrong picks shake and say
// "try again" (via sound), never block. Resolves when every floor is filled.

import { h } from './ui.js';
import { key, round, rangeFloors, formatValueHTML, formatValue } from './numbers.js';
import * as sfx from './audio.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

export function runSetup({ level, building, consoleBody, banner, scoreApi }) {
  return new Promise((finish) => {
    const grid = rangeFloors(level.min, level.max, level.step);
    const gridKeys = new Set(grid.map(key));
    const anchorKeys = new Set(level.anchors.map(key));

    level.anchors.forEach((v) => building.fillFloor(v, { locked: true, anchor: true }));

    const blanks = grid.filter((v) => !anchorKeys.has(key(v)));
    let remaining = blanks.length;

    banner.innerHTML = '';
    banner.append(
      h('strong', {}, 'בונים את ציר המספרים 🏗️'),
      h('span', {}, 'הקישו על מספר, ואז על הקומה שלו. הקפיצה בין הקומות קבועה!'),
    );

    // Turn empty badges into tappable slots.
    const openSlots = new Map(); // key -> {value, badge}
    blanks.forEach((v) => {
      const f = building.floorAt(v);
      f.badge.classList.add('is-slot');
      f.badge.setAttribute('role', 'button');
      f.badge.setAttribute('tabindex', '0');
      f.badge.setAttribute('aria-label', 'קומה ריקה');
      f.badge.addEventListener('click', () => pickSlot(v, f.badge));
      f.badge.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickSlot(v, f.badge); } });
      openSlots.set(key(v), { value: v, badge: f.badge });
    });

    // Build the tile tray (correct values + a few distractors, shuffled).
    const tray = h('div', { class: 'tray' });
    consoleBody.innerHTML = '';
    consoleBody.append(h('div', { class: 'tray-title' }, 'המספרים שצריך לשבֵּץ'), tray);

    const distractors = makeDistractors(level, gridKeys, level.distractors);
    const tiles = shuffle([
      ...blanks.map((v) => ({ value: v })),
      ...distractors.map((v) => ({ value: v })),
    ]);
    tiles.forEach((t) => {
      const el = h('button', { class: 'tile', type: 'button', 'aria-label': formatValue(t.value, level.type) });
      el.innerHTML = formatValueHTML(t.value, level.type);
      el.addEventListener('click', () => pickTile(t.value, el));
      tray.append(el);
    });

    let pickedTile = null; // { value, el }
    let pickedSlot = null; // { value, badge }

    const dropTile = () => { pickedTile?.el.classList.remove('is-picked'); pickedTile = null; };
    const dropSlot = () => { pickedSlot?.badge.classList.remove('is-target'); pickedSlot = null; };

    function pickTile(value, el) {
      if (pickedTile && pickedTile.el === el) { dropTile(); return; }
      dropTile();
      pickedTile = { value, el };
      el.classList.add('is-picked');
      sfx.click();
      tryPair();
    }
    function pickSlot(value, badge) {
      if (!openSlots.has(key(value))) return;
      if (pickedSlot && pickedSlot.badge === badge) { dropSlot(); return; }
      dropSlot();
      pickedSlot = { value, badge };
      badge.classList.add('is-target');
      tryPair();
    }

    function tryPair() {
      if (!pickedTile || !pickedSlot) return;
      const tile = pickedTile;
      const slot = pickedSlot;

      if (key(tile.value) === key(slot.value)) {
        building.fillFloor(slot.value, { locked: true });
        slot.badge.classList.remove('is-slot', 'is-target');
        slot.badge.removeAttribute('role');
        slot.badge.removeAttribute('tabindex');
        openSlots.delete(key(slot.value));
        tile.el.disabled = true;
        tile.el.classList.add('placed');
        setTimeout(() => tile.el.remove(), 200);
        sfx.place();
        scoreApi.add(10);
        pickedTile = null; pickedSlot = null;
        if (--remaining === 0) done();
      } else {
        sfx.wrong();
        scoreApi.mistake();
        const t = pickedTile.el, b = pickedSlot.badge;
        t.classList.add('shake'); b.classList.add('shake');
        setTimeout(() => { t.classList.remove('shake'); b.classList.remove('shake'); }, 440);
        dropTile(); dropSlot();
      }
    }

    async function done() {
      banner.innerHTML = '';
      banner.append(h('strong', { class: 'banner--win' }, 'הבניין מוכן! מתחילים להסיע 🛗'));
      building.el.classList.add('ready-pulse');
      await wait(950);
      building.el.classList.remove('ready-pulse');
      finish();
    }
  });
}

/** A few plausible wrong tiles, taken from just outside the axis range. */
function makeDistractors(level, gridKeys, count) {
  if (!count) return [];
  const s = level.step;
  const cands = [level.max + s, level.max + 2 * s, level.max + 3 * s, level.min - s, level.min - 2 * s].map(round);
  const out = [];
  for (const v of cands) {
    if (!gridKeys.has(key(v)) && !out.some((o) => key(o) === key(v))) {
      out.push(v);
      if (out.length >= count) break;
    }
  }
  return out;
}
