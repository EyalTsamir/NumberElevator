// building.js — renders the elevator tower (the number line) for a level and
// exposes geometry + per-floor helpers. It does not animate; elevator.js does.

import { h } from './ui.js';
import { rangeFloors, formatValueHTML, formatValue, isGround, key } from './numbers.js';

export function createBuilding(level) {
  const asc = rangeFloors(level.min, level.max, level.step); // ascending values
  const desc = [...asc].reverse();                            // top-of-building first
  const n = asc.length;

  const floors = [];
  const floorsEl = h('div', { class: 'floors' });

  desc.forEach((value, topIndex) => {
    const badge = h('div', {
      class: 'floor__badge',
      dataset: { value: key(value) },
      'aria-hidden': 'true',
    });
    const room = h('div', { class: 'floor__room' },
      h('span', { class: 'floor__win' }),
      h('span', { class: 'floor__marker' }),
    );
    const row = h('div', {
      class: 'floor'
        + (isGround(value) ? ' floor--ground' : '')
        + (value < 0 ? ' floor--basement' : ''),
      dataset: { value: key(value), index: topIndex },
    },
      h('div', { class: 'floor__axis' }, h('span', { class: 'floor__tick' }), badge),
      room,
    );
    floors.push({ value, topIndex, row, badge, room });
    floorsEl.append(row);
  });

  const car = h('div', { class: 'car' },
    h('div', { class: 'car__cabin' },
      h('div', { class: 'car__rider' }),
      h('div', { class: 'car__door car__door--a' }),
      h('div', { class: 'car__door car__door--b' }),
    ),
    h('div', { class: 'car__hook' }),
    h('div', { class: 'car__readout' }, h('span', { class: 'car__readout-val' }, '0')),
  );

  const shaft = h('div', { class: 'shaft' }, h('div', { class: 'shaft__line' }), floorsEl, car);

  const el = h('div', { class: 'building', dataset: { floors: n } },
    h('div', { class: 'building__roof' }, h('span', { class: 'roof-sign' }, 'מעלית המספרים')),
    shaft,
    h('div', { class: 'building__base' }),
  );

  const floorAt = (value) => floors.find((f) => key(f.value) === key(value));
  const topIndexOf = (value) => { const f = floorAt(value); return f ? f.topIndex : 0; };

  return {
    el, shaft, car, floors, asc, desc, n, level,
    floorAt, topIndexOf,

    /** Put a value label onto a floor (phase 1 fill / phase 2 reveal). */
    fillFloor(value, { locked = false, anchor = false } = {}) {
      const f = floorAt(value);
      if (!f) return;
      f.badge.innerHTML = formatValueHTML(value, level.type);
      f.badge.classList.add('is-filled');
      f.badge.classList.toggle('is-locked', locked);
      f.badge.classList.toggle('is-anchor', anchor);
      f.badge.setAttribute('aria-hidden', 'false');
      f.badge.setAttribute('aria-label', formatValue(value, level.type));
    },
    clearFloor(value) {
      const f = floorAt(value);
      if (!f) return;
      f.badge.innerHTML = '';
      f.badge.className = 'floor__badge';
    },
    highlight(value, cls) { floorAt(value)?.row.classList.add(cls); },
    unhighlight(value, cls) { floorAt(value)?.row.classList.remove(cls); },
    clearHighlights(cls) { floors.forEach((f) => f.row.classList.remove(cls)); },
  };
}

/** Size floors so the whole tower fits the available height. Call after mount. */
export function fitBuilding(building, availableHeight) {
  const n = building.n;
  const roof = 46, base = 20, gap = 8;
  const usable = Math.max(160, availableHeight - roof - base);
  const floorH = Math.max(46, Math.min(84, Math.floor(usable / n) - gap));
  building.el.style.setProperty('--floor-h', floorH + 'px');
}
