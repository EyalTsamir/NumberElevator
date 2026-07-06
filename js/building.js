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
    const ground = isGround(value);
    const room = h('div', { class: 'floor__room' },
      h('span', { class: 'floor__landing', 'aria-hidden': 'true' },
        h('span', { class: 'floor__landing-lamp' }),
        h('span', { class: 'floor__landing-door' }),
      ),
      ground ? h('span', { class: 'floor__awning', 'aria-hidden': 'true' }) : null,
      ground ? h('span', { class: 'floor__door', 'aria-hidden': 'true' }) : null,
      h('span', { class: 'floor__win' }),
      h('span', { class: 'floor__marker' }),
    );
    const row = h('div', {
      class: 'floor'
        + (ground ? ' floor--ground' : '')
        + (value < 0 ? ' floor--basement' : ''),
      dataset: { value: key(value), index: topIndex },
    },
      h('div', { class: 'floor__axis' }, h('span', { class: 'floor__tick' }), badge),
      h('div', { class: 'floor__gap' }),
      room,
    );
    floors.push({ value, topIndex, row, badge, room });
    floorsEl.append(row);
  });

  const car = h('div', { class: 'car' },
    h('div', { class: 'car__cable' }),
    h('div', { class: 'car__cabin' },
      h('div', { class: 'car__interior' },
        h('span', { class: 'car__lamp' }),
      ),
      h('div', { class: 'car__door car__door--a' }),
      h('div', { class: 'car__door car__door--b' }),
      h('div', { class: 'car__frame' }),
    ),
    h('div', { class: 'car__readout' }, h('span', { class: 'car__readout-val' }, '0')),
  );

  const shaft = h('div', { class: 'shaft' },
    floorsEl,
    h('div', { class: 'shaft__wall', 'aria-hidden': 'true' },
      h('span', { class: 'shaft__rail shaft__rail--l' }),
      h('span', { class: 'shaft__rail shaft__rail--r' }),
    ),
    h('div', { class: 'shaft__cw', 'aria-hidden': 'true' },
      h('span', { class: 'shaft__cw-cable' }),
      h('span', { class: 'shaft__cw-block' }),
    ),
    car,
  );

  const el = h('div', { class: 'building', dataset: { floors: n } },
    h('div', { class: 'building__roof' },
      h('div', { class: 'roof__hut', 'aria-hidden': 'true' }, h('span', { class: 'roof__sheave' })),
      h('span', { class: 'roof-sign' }, 'מעלית המספרים'),
    ),
    shaft,
    h('div', { class: 'building__base' }),
  );
  el.style.setProperty('--nfloors', n);

  const floorAt = (value) => floors.find((f) => key(f.value) === key(value));
  const topIndexOf = (value) => { const f = floorAt(value); return f ? f.topIndex : 0; };

  // Auto-follow: when the shaft is in scroll mode (more floors than fit the height),
  // keep the given floor centered in the scrollable shaft.
  const scrollToIndex = (topIndex) => {
    if (!shaft.classList.contains('is-scroll')) return;
    const fh = parseFloat(getComputedStyle(el).getPropertyValue('--floor-h')) || 0;
    if (!fh) return;
    const target = topIndex * fh + fh / 2 - shaft.clientHeight / 2;
    const max = Math.max(0, shaft.scrollHeight - shaft.clientHeight);
    shaft.scrollTo({ top: Math.min(max, Math.max(0, target)), behavior: 'smooth' });
  };

  return {
    el, shaft, car, floors, asc, desc, n, level,
    floorAt, topIndexOf, scrollToIndex,
    scrollToValue: (value) => scrollToIndex(topIndexOf(value)),

    /** Put a value label onto a floor (phase 1 anchors / phase 2 fill). */
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
  };
}

/**
 * Size floors so the tower fits the available height. When even the minimum floor
 * height won't fit (many floors on a short screen), clamp to the minimum and switch
 * the shaft to an internal scroll container (elevator auto-follows — see scrollToIndex).
 * `minFloor` is mode-dependent: 44 when floors are tapped, smaller when they're not.
 * Returns { floorH, fits }. Call after mount and on resize.
 */
export function fitBuilding(building, availableHeight, { minFloor = 40 } = {}) {
  const n = building.n;
  const el = building.el;
  const MAX = 88, SAFE = 4;
  // Measure roof + sidewalk overhead straight from the DOM so it can't desync from CSS.
  const roofH = el.querySelector('.building__roof')?.offsetHeight || 66;
  const baseH = el.querySelector('.building__base')?.offsetHeight || 22;
  const ideal = Math.floor((availableHeight - roofH - baseH - SAFE) / n);
  const fits = ideal >= minFloor;
  const floorH = Math.max(minFloor, Math.min(MAX, ideal));
  el.style.setProperty('--floor-h', floorH + 'px');
  building.shaft.classList.toggle('is-scroll', !fits);
  return { floorH, fits };
}
