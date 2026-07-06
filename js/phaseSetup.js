// phaseSetup.js — Phase 2: build the number line by dragging each tile onto
// the floor it belongs to. The jump between floors was already established in
// phase 1, so this is pure placement. Wrong drops shake and say "try again"
// (via sound), never block; resolves when every floor is filled.

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
    const blanks = grid.filter((v) => !anchorKeys.has(key(v)));
    let remaining = blanks.length;

    banner.innerHTML = '';
    banner.append(
      h('strong', {}, 'משבצים את המספרים 🏗️'),
      h('span', {}, 'גררו כל מספר לקומה שמתאימה לו.'),
    );

    // Turn empty badges into drop targets.
    const openSlots = new Map(); // key -> {value, badge}
    blanks.forEach((v) => {
      const f = building.floorAt(v);
      f.badge.classList.add('is-slot');
      f.badge.setAttribute('aria-label', 'קומה ריקה');
      openSlots.set(key(v), { value: v, badge: f.badge });
    });

    // Build the tile tray (correct values + a few distractors, shuffled).
    const tray = h('div', { class: 'tray' });
    consoleBody.innerHTML = '';
    consoleBody.append(h('div', { class: 'tray-title' }, 'גררו כל מספר לקומה שלו'), tray);

    const distractors = makeDistractors(level, gridKeys, level.distractors);
    const tiles = shuffle([
      ...blanks.map((v) => ({ value: v })),
      ...distractors.map((v) => ({ value: v })),
    ]);
    tiles.forEach((t) => {
      const el = h('div', { class: 'tile', 'aria-label': formatValue(t.value, level.type) });
      el.innerHTML = formatValueHTML(t.value, level.type);
      tray.append(el);
      makeDraggable(el, (slotBadge) => handleDrop(t.value, el, slotBadge));
    });

    function handleDrop(value, tileEl, slotBadge) {
      if (!slotBadge) return; // dropped on empty space — snap back silently, no penalty
      const slotKey = slotBadge.dataset.value;
      const slot = openSlots.get(slotKey);
      if (!slot) return; // already filled

      if (key(value) === slotKey) {
        building.fillFloor(slot.value, { locked: true });
        slot.badge.classList.remove('is-slot');
        slot.badge.removeAttribute('aria-label');
        openSlots.delete(slotKey);
        tileEl.classList.add('placed');
        setTimeout(() => tileEl.remove(), 200);
        sfx.place();
        scoreApi.add(10);
        if (--remaining === 0) done();
      } else {
        sfx.wrong();
        scoreApi.mistake();
        slotBadge.classList.add('shake');
        tileEl.classList.add('shake');
        setTimeout(() => { slotBadge.classList.remove('shake'); tileEl.classList.remove('shake'); }, 440);
      }
    }

    async function done() {
      banner.innerHTML = '';
      banner.append(h('strong', { class: 'banner--win' }, 'הבניין מוכן! 🎉'));
      building.el.classList.add('ready-pulse');
      await wait(950);
      building.el.classList.remove('ready-pulse');
      finish();
    }
  });
}

/**
 * Makes `el` draggable via Pointer Events (unifies mouse, touch & pen).
 * A floating clone follows the pointer while the source dims in place;
 * `onDrop(slotBadge | null)` fires with whatever floor badge is under the
 * pointer at release.
 */
function makeDraggable(el, onDrop) {
  let ghost = null;
  let offsetX = 0, offsetY = 0;
  let hovered = null;

  el.addEventListener('pointerdown', (e) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    ghost = el.cloneNode(true);
    ghost.classList.add('tile--ghost');
    Object.assign(ghost.style, {
      position: 'fixed', left: rect.left + 'px', top: rect.top + 'px',
      width: rect.width + 'px', height: rect.height + 'px', margin: '0', pointerEvents: 'none',
    });
    document.body.append(ghost);
    el.classList.add('is-dragging-src');
    sfx.click();

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  });

  function onMove(e) {
    ghost.style.left = (e.clientX - offsetX) + 'px';
    ghost.style.top = (e.clientY - offsetY) + 'px';
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const slot = under?.closest('.floor__badge.is-slot') || null;
    if (slot !== hovered) {
      hovered?.classList.remove('is-target');
      hovered = slot;
      hovered?.classList.add('is-target');
    }
  }

  function onUp(e) {
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const slot = under?.closest('.floor__badge.is-slot') || null;
    teardown();
    onDrop(slot);
  }

  function onCancel() {
    teardown();
    onDrop(null);
  }

  function teardown() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    hovered?.classList.remove('is-target');
    hovered = null;
    ghost?.remove();
    ghost = null;
    el.classList.remove('is-dragging-src');
  }
}

/** A few plausible wrong tiles, taken from just outside the axis range. */
function makeDistractors(level, gridKeys, count) {
  if (!count) return [];
  const s = level.step;
  const cands = [level.max + s, level.max + 2 * s, level.max + 3 * s, level.min - s, level.min - 2 * s].map(round);
  const out = [];
  for (const v of cands) {
    if (v < 0) continue; // axis is non-negative — never offer a negative tile
    if (!gridKeys.has(key(v)) && !out.some((o) => key(o) === key(v))) {
      out.push(v);
      if (out.length >= count) break;
    }
  }
  return out;
}
