// phaseStep.js — Phase 1: figure out the elevator's increment (how much the
// ride rises by from one floor to the next). The anchor floors are already
// labeled on the tower; the child studies the gaps and picks the right jump.

import { h } from './ui.js';
import { round, key, formatValueHTML, formatValue } from './numbers.js';
import * as sfx from './audio.js';

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

export function runStep({ level, building, consoleBody, banner, scoreApi }) {
  return new Promise((finish) => {
    level.anchors.forEach((v) => building.fillFloor(v, { locked: true, anchor: true }));

    banner.innerHTML = '';
    banner.append(
      h('strong', {}, 'בכמה עולים בכל קומה? 🛗'),
      h('span', {}, 'הביטו בבניין ובחרו את הקפיצה שבין קומה לקומה.'),
    );

    const tray = h('div', { class: 'tray step-options' });
    consoleBody.innerHTML = '';
    consoleBody.append(h('div', { class: 'tray-title' }, 'כל קפיצה שווה ל...'), tray);

    let attempts = 0;
    const options = shuffle(makeStepOptions(level));
    const buttons = options.map((v) => {
      const el = h('button', { class: 'tile', type: 'button', 'aria-label': formatValue(v, level.type) });
      el.innerHTML = formatValueHTML(v, level.type);
      el.addEventListener('click', () => choose(v, el));
      tray.append(el);
      return el;
    });

    function choose(value, el) {
      if (key(value) === key(level.step)) {
        sfx.place();
        scoreApi.add(Math.max(10, 30 - attempts * 10));
        el.classList.add('is-correct');
        buttons.forEach((b) => { b.disabled = true; });
        setTimeout(finish, 550);
      } else {
        sfx.wrong();
        scoreApi.mistake();
        attempts++;
        el.disabled = true;
        el.classList.add('shake', 'is-wrong');
        setTimeout(() => el.classList.remove('shake'), 440);
      }
    }
  });
}

/** The real step plus 3 plausible distractors, as multiple-choice options. */
function makeStepOptions(level) {
  const pools = {
    whole: [1, 2, 3, 5, 10],
    fraction: [0.25, 0.5, 1, 2],
    decimal: [0.1, 0.2, 0.5, 1, 2],
  };
  const pool = [...(pools[level.type] || pools.whole), level.step * 2, level.step / 2];
  const seen = new Set([key(level.step)]);
  const distractors = [];
  for (const v of shuffle(pool)) {
    const rv = round(v);
    if (rv <= 0) continue;
    const k = key(rv);
    if (seen.has(k)) continue;
    seen.add(k);
    distractors.push(rv);
    if (distractors.length >= 3) break;
  }
  return [level.step, ...distractors];
}
