// passengers.js — generates the delivery tasks for phase 2 and draws the
// little passenger characters.

import { h } from './ui.js';
import { rangeFloors } from './numbers.js';

const COLORS = ['#ff7a59', '#4c9aff', '#37b26b', '#ef5da8', '#f7c948', '#8b5cf6', '#22c1c3'];
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

/**
 * Build the round's passengers. Each has an origin & destination floor.
 * - 'distance'    : child answers HOW MANY floors the trip is (integer).
 * - 'destination' : child presses the destination floor given "go up/down N".
 * distance is always the whole number of floors between origin and dest.
 */
export function makePassengers(level) {
  const vals = rangeFloors(level.min, level.max, level.step); // ascending
  const n = vals.length;
  const maxJump = Math.min(n - 1, Math.max(3, Math.round(n * 0.7)));
  const list = [];
  let prevDest = null;

  for (let i = 0; i < level.passengers; i++) {
    let a = prevDest != null && Math.random() < 0.5 ? prevDest : randInt(0, n - 1);
    let b = randInt(0, n - 1);
    let guard = 0;
    while ((b === a || Math.abs(b - a) > maxJump) && guard++ < 40) b = randInt(0, n - 1);
    if (b === a) b = a < n - 1 ? a + 1 : a - 1;
    prevDest = b;

    list.push({
      kind: Math.random() < level.distancePortion ? 'distance' : 'destination',
      originVal: vals[a],
      destVal: vals[b],
      distance: Math.abs(b - a),
      dir: b > a ? 1 : -1,
      color: COLORS[i % COLORS.length],
    });
  }
  return list;
}

/** A round blob passenger with a face. */
export function passengerEl(color, extraClass = '') {
  return h('div', { class: 'rider-char ' + extraClass, style: { '--c': color } },
    h('div', { class: 'rider-char__body' },
      h('span', { class: 'rider-char__eye' }),
      h('span', { class: 'rider-char__eye rider-char__eye--r' }),
      h('span', { class: 'rider-char__mouth' }),
    ),
  );
}
