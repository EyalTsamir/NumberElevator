// phaseSetup.js — Phase 2: build the number line by dragging each tile onto
// the floor it belongs to. The jump between floors was already established in
// phase 1, so this is pure placement.
//
// Two equivalent ways to place a number, so no input method is left out:
//   • Drag a tile onto a floor (mouse / touch / pen).
//   • Tap/click a tile to "pick it up", then tap/click the floor to drop it —
//     this is also the keyboard path (tiles and open floors are real buttons,
//     so Tab + Enter/Space works, and screen readers can operate it).
// Wrong drops shake and say "try again" (via sound), never block; resolves when
// every floor is filled.

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
      h('span', {}, 'גררו כל מספר לקומה שלו — או הקישו על מספר ואז על הקומה.'),
    );

    // --- shared interaction state -------------------------------------------
    let armed = null;        // the "picked up" tile: { value, el }  (tap / keyboard path)
    let activeDrag = null;   // { pointerId, teardown } — guards against overlapping drags

    // Turn empty badges into drop targets AND focusable buttons.
    const openSlots = new Map(); // key -> {value, badge}
    blanks.forEach((v) => {
      const f = building.floorAt(v);
      makeSlotInteractive(f.badge);
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
      const el = h('button', {
        class: 'tile', type: 'button', 'aria-pressed': 'false',
        'aria-label': `${formatValue(t.value, level.type)} — בחרו כדי למקם`,
      });
      el.innerHTML = formatValueHTML(t.value, level.type);
      tray.append(el);
      makeTile(el, t.value);
    });

    // Portrait dock: the tiles live in one horizontally-scrollable row. Fade the
    // edges only while they actually overflow, so a child sees there's more to reach.
    const trayRO = new ResizeObserver(() => {
      tray.classList.toggle('has-overflow', tray.scrollWidth - tray.clientWidth > 4);
    });
    trayRO.observe(tray);

    // ---- pick-up ("arm") model ---------------------------------------------
    function toggleArm(value, el) {
      if (armed && armed.el === el) { clearArmed(); return; }
      clearArmed();
      armed = { value, el };
      el.classList.add('is-armed');
      el.setAttribute('aria-pressed', 'true');
      building.el.classList.add('is-arming'); // CSS lights up the open floors
      sfx.click();
    }
    function clearArmed() {
      if (!armed) return;
      armed.el.classList.remove('is-armed');
      armed.el.setAttribute('aria-pressed', 'false');
      armed = null;
      building.el.classList.remove('is-arming');
    }

    // ---- a floor as an interactive drop target -----------------------------
    function makeSlotInteractive(badge) {
      badge.classList.add('is-slot');
      badge.setAttribute('role', 'button');
      badge.setAttribute('tabindex', '0');
      badge.setAttribute('aria-hidden', 'false');
      badge.setAttribute('aria-label', 'קומה ריקה — בחרו כאן את המספר');
      badge.addEventListener('click', () => activateSlot(badge, false));
      badge.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); activateSlot(badge, true); }
      });
    }
    function activateSlot(badge, viaKey) {
      if (!badge.classList.contains('is-slot')) return; // already filled
      if (!armed) { nudgeTray(); return; }              // nothing picked up yet
      const tile = armed;
      clearArmed();
      handleDrop(tile.value, tile.el, badge, { refocus: viaKey });
    }
    function nudgeTray() {
      tray.classList.remove('shake'); void tray.offsetWidth; tray.classList.add('shake');
    }

    // ---- placement result (shared by drag + tap/keyboard) ------------------
    function handleDrop(value, tileEl, slotBadge, { refocus = false } = {}) {
      if (!slotBadge) return; // dropped on empty space — snap back silently, no penalty
      const slotKey = slotBadge.dataset.value;
      const slot = openSlots.get(slotKey);
      if (!slot) return; // already filled

      if (key(value) === slotKey) {
        building.fillFloor(slot.value, { locked: true });
        slot.badge.classList.remove('is-slot', 'is-target');
        slot.badge.removeAttribute('role');
        slot.badge.removeAttribute('tabindex');
        openSlots.delete(slotKey);
        tileEl.classList.add('placed');
        tileEl.disabled = true;
        setTimeout(() => tileEl.remove(), 200);
        sfx.place();
        scoreApi.correct(10);
        // Keep a keyboard player moving: hand focus to the next number to place.
        if (refocus) tray.querySelector('.tile:not(.placed)')?.focus();
        if (--remaining === 0) done();
      } else {
        sfx.wrong();
        scoreApi.mistake();
        slotBadge.classList.add('shake');
        tileEl.classList.add('shake');
        setTimeout(() => { slotBadge.classList.remove('shake'); tileEl.classList.remove('shake'); }, 440);
      }
    }

    /**
     * Wire a tile for both drag and tap/keyboard:
     *   • A real drag (pointer moved past a small threshold) picks the tile up and
     *     drops it on whatever floor is under the pointer.
     *   • A tap (no movement) or Enter/Space "arms" the tile instead.
     * A single-drag guard (activeDrag) plus a global cancel makes an interrupted
     * gesture impossible to leave a ghost/stuck tile behind.
     */
    function makeTile(el, value) {
      let ghost = null, offsetX = 0, offsetY = 0, hovered = null;
      let dragging = false, startX = 0, startY = 0, pid = null, suppressClick = false;
      const THRESH = 6;

      el.addEventListener('pointerdown', (e) => {
        if (el.disabled) return;
        if (e.button != null && e.button > 0) return; // ignore right/middle click
        if (activeDrag) return;                        // a drag is already in progress
        pid = e.pointerId;
        startX = e.clientX; startY = e.clientY;
        dragging = false;
        suppressClick = false; // fresh gesture — don't let a previous drag's flag leak in
        activeDrag = { pointerId: pid, teardown };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onCancel);
      });

      // The single activation path: a tap, a keyboard Enter/Space (native buttons
      // synthesize a click for these), and assistive-tech activation all land here.
      // A real drag sets suppressClick so its trailing click doesn't also arm.
      el.addEventListener('click', () => {
        if (suppressClick) { suppressClick = false; return; }
        if (el.disabled) return;
        toggleArm(value, el);
      });

      function beginDrag() {
        dragging = true;
        suppressClick = true; // this gesture is a drag, not a tap — swallow the click
        clearArmed(); // a drag supersedes any pick-up selection
        const rect = el.getBoundingClientRect();
        offsetX = startX - rect.left;
        offsetY = startY - rect.top;
        ghost = el.cloneNode(true);
        ghost.classList.add('tile--ghost');
        ghost.removeAttribute('aria-label');
        Object.assign(ghost.style, {
          position: 'fixed', left: rect.left + 'px', top: rect.top + 'px',
          width: rect.width + 'px', height: rect.height + 'px', margin: '0', pointerEvents: 'none',
        });
        document.body.append(ghost);
        el.classList.add('is-dragging-src');
        sfx.click();
      }

      function onMove(e) {
        if (e.pointerId !== pid) return;
        if (!dragging) {
          if (Math.abs(e.clientX - startX) < THRESH && Math.abs(e.clientY - startY) < THRESH) return;
          beginDrag();
        }
        e.preventDefault();
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
        if (e.pointerId !== pid) return;
        const wasDragging = dragging;
        let slot = null;
        if (wasDragging) {
          const under = document.elementFromPoint(e.clientX, e.clientY);
          slot = under?.closest('.floor__badge.is-slot') || null;
        }
        teardown();
        // A drag drops here; a tap falls through to the `click` handler above.
        if (wasDragging && slot) handleDrop(value, el, slot); // off-target → snaps back, no penalty
      }

      function onCancel(e) {
        if (e.pointerId !== pid) return;
        teardown();
      }

      function teardown() {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        hovered?.classList.remove('is-target'); hovered = null;
        ghost?.remove(); ghost = null;
        el.classList.remove('is-dragging-src');
        dragging = false;
        if (activeDrag && activeDrag.pointerId === pid) activeDrag = null;
        pid = null;
      }
    }

    // Safety net: if the tab is hidden or the window loses focus mid-drag (e.g. a
    // notification steals it), force-clean any in-flight gesture.
    function forceCleanupDrag() { activeDrag?.teardown?.(); }
    const onBlur = () => forceCleanupDrag();
    const onVisibility = () => { if (document.hidden) forceCleanupDrag(); };
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);

    async function done() {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      trayRO.disconnect();
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
 * A few plausible wrong tiles. Mostly from just outside the axis range, but for
 * whole-number levels we occasionally slip in an IN-range value that sits between
 * two real floors — so a child can't win by always discarding "the biggest and
 * smallest"; ruling it out takes real number-line reasoning.
 */
function makeDistractors(level, gridKeys, count) {
  if (!count) return [];
  const s = level.step;
  const out = [];
  const pushIf = (v) => {
    const rv = round(v);
    if (rv < 0) return;                                   // axis is non-negative
    if (gridKeys.has(key(rv))) return;                    // never offer a real floor
    if (out.some((o) => key(o) === key(rv))) return;      // no duplicates
    out.push(rv);
  };

  if (level.type === 'whole' && s >= 2 && Math.random() < 0.6) {
    const steps = Math.round((level.max - level.min) / s);
    const gi = 1 + Math.floor(Math.random() * Math.max(1, steps - 1)); // an interior floor
    const base = round(level.min + gi * s);
    for (const cand of [base + 1, base - 1, base + 2]) {
      if (cand > level.min && cand < level.max && !gridKeys.has(key(cand))) { pushIf(cand); break; }
    }
  }

  const outside = [level.max + s, level.max + 2 * s, level.max + 3 * s, level.min - s, level.min - 2 * s].map(round);
  for (const v of outside) { if (out.length >= count) break; pushIf(v); }
  return out.slice(0, count);
}
