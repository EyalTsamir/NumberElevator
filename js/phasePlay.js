// phasePlay.js — Phase 2: deliver passengers.
//  • 'distance'    — child types HOW MANY floors the elevator travels (keypad).
//  • 'destination' — child taps the destination floor given "go up/down N".
// Correct answers drive the elevator (with a rider) and a delivery "ding".

import { h } from './ui.js';
import { key, formatValue, formatValueHTML } from './numbers.js';
import { makePassengers, passengerEl } from './passengers.js';
import * as sfx from './audio.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const valSpan = (v, type) => h('span', { class: 'q-val', html: formatValueHTML(v, type) });

export async function runPlay({ level, building, elevator, consoleBody, banner, scoreApi }) {
  const passengers = makePassengers(level);
  const total = passengers.length;

  for (let i = 0; i < total; i++) {
    await deliver(passengers[i], i + 1);
  }

  banner.innerHTML = '';
  banner.append(h('strong', { class: 'banner--win' }, 'כל הנוסעים הגיעו ליעד! 🎉'));
  consoleBody.innerHTML = '';
  await wait(500);

  // --- deliver one passenger ---
  function deliver(p, num) {
    return new Promise((done) => {
      let attempts = 0;
      let busy = false;
      let pickHandlers = []; // floor-tap listeners for 'destination' tasks

      elevator.place(p.originVal);
      elevator.openDoors();
      building.clearHighlights('is-origin');
      building.clearHighlights('is-dest');
      building.highlight(p.originVal, 'is-origin');
      if (p.kind === 'distance') building.highlight(p.destVal, 'is-dest');

      banner.innerHTML = '';
      banner.append(
        h('span', { class: 'banner__count' }, `נוסע ${num} מתוך ${total}`),
        h('strong', {}, p.kind === 'distance' ? 'מדדו את המרחק 📏' : 'לאן צריך להגיע? 🎯'),
      );

      consoleBody.innerHTML = '';
      const card = h('div', { class: 'passenger-card' },
        passengerEl(p.color),
        buildQuestion(p),
      );
      consoleBody.append(card);

      if (p.kind === 'distance') {
        const kp = keypad((value) => submit(value === p.distance, kp));
        consoleBody.append(kp.el);
      } else {
        consoleBody.append(h('p', { class: 'tap-hint' }, 'הקישו על הקומה הנכונה בבניין 👆'));
        enableFloorPick((value) => submit(key(value) === key(p.destVal)));
      }

      function buildQuestion(p) {
        if (p.kind === 'distance') {
          return h('p', { class: 'question' },
            'הנוסע/ת בקומה ', valSpan(p.originVal, level.type),
            ' רוצה להגיע לקומה ', valSpan(p.destVal, level.type),
            '. כמה קומות תיסע המעלית?');
        }
        return h('p', { class: 'question' },
          'הנוסע/ת בקומה ', valSpan(p.originVal, level.type), ' רוצה ',
          h('b', {}, p.dir > 0 ? 'לעלות' : 'לרדת'), ' ', h('b', {}, String(p.distance)),
          ' קומות. לאיזו קומה צריך להגיע?');
      }

      async function submit(correct, kp) {
        if (busy) return;
        if (!correct) {
          sfx.wrong();
          scoreApi.mistake();
          attempts++;
          flashWrong(kp);
          banner.querySelector('strong').textContent = 'כמעט! נסו שוב 💪';
          return;
        }
        busy = true;
        disableFloorPick();
        const points = Math.max(10, 50 - attempts * 15);

        building.clearHighlights('is-origin');
        building.clearHighlights('is-dest');
        elevator.setRider(p.color);
        await wait(180);
        await elevator.moveTo(p.destVal);
        sfx.ding();
        dropOff(p);
        elevator.setRider(null);
        scoreApi.add(points);
        floatPoints(points);
        await wait(650);
        done();
      }

      function dropOff(p) {
        const f = building.floorAt(p.destVal);
        if (!f) return;
        const pop = passengerEl(p.color, 'rider-pop');
        f.room.append(pop);
        f.room.classList.add('delivered');
        setTimeout(() => { pop.remove(); f.room.classList.remove('delivered'); }, 1300);
      }

      function floatPoints(points) {
        const tag = h('div', { class: 'float-points' }, '+' + points);
        building.car.append(tag);
        setTimeout(() => tag.remove(), 1000);
      }

      // floor-tapping for 'destination' tasks
      function enableFloorPick(onPick) {
        building.el.classList.add('pick-floor');
        building.floors.forEach((f) => {
          const handler = () => { if (!busy) { sfx.click(); onPick(f.value); } };
          f.row.classList.add('is-pickable');
          f.row.addEventListener('click', handler);
          pickHandlers.push({ row: f.row, handler });
        });
      }
      function disableFloorPick() {
        building.el.classList.remove('pick-floor');
        pickHandlers.forEach(({ row, handler }) => { row.classList.remove('is-pickable'); row.removeEventListener('click', handler); });
        pickHandlers = [];
      }
    });
  }
}

/** Numeric keypad for distance answers. onSubmit(value:number). */
function keypad(onSubmit) {
  let val = '';
  const display = h('div', { class: 'keypad__display is-empty' }, '');
  const setVal = (v) => { val = v; display.textContent = v; display.classList.toggle('is-empty', v === ''); };

  const pad = h('div', { class: 'keypad' });
  const num = (d) => h('button', { class: 'key', type: 'button', onClick: () => { if (val.length < 2) { setVal(val + d); sfx.click(); } } }, d);
  for (const d of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) pad.append(num(d));
  pad.append(
    h('button', { class: 'key key--del', type: 'button', 'aria-label': 'מחיקה', onClick: () => { setVal(val.slice(0, -1)); sfx.click(); } }, '⌫'),
    num('0'),
    h('button', { class: 'key key--ok', type: 'button', 'aria-label': 'אישור', onClick: () => { if (val !== '') onSubmit(parseInt(val, 10)); } }, '✓'),
  );

  const wrap = h('div', { class: 'keypad-wrap' }, display, pad);
  return { el: wrap, display, reset: () => setVal('') };
}

function flashWrong(kp) {
  const target = kp ? kp.display : null;
  if (target) {
    target.classList.add('shake', 'is-wrong');
    setTimeout(() => { target.classList.remove('shake', 'is-wrong'); if (kp.reset) kp.reset(); }, 480);
  }
}
