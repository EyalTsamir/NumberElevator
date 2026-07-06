// phaseStep.js — Phase 1: figure out the elevator's jump (how much it rises from
// one floor to the next) and WRITE it. The anchor floors are already labeled on
// the tower; the child studies the gaps and types the jump on a number pad.
// Fraction jumps (¼, ½…) fall back to tap-to-choose, since they're awkward to type.

import { h } from './ui.js';
import { round, key, formatValueHTML, formatValue } from './numbers.js';
import * as sfx from './audio.js';

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

export function runStep(ctx) {
  const { level } = ctx;
  return level.type === 'fraction' ? runChoose(ctx) : runType(ctx);
}

// --- typed entry (whole / decimal / percent) ---
function runType({ level, building, consoleBody, banner, scoreApi }) {
  return new Promise((finish) => {
    level.anchors.forEach((v) => building.fillFloor(v, { locked: true, anchor: true }));

    banner.innerHTML = '';
    banner.append(
      h('strong', {}, 'בכמה עולים בכל קומה? 🛗'),
      h('span', {}, 'הביטו בבניין וכתבו בכמה המעלית עולה בכל קפיצה.'),
    );

    const isPercent = level.type === 'percent';
    const allowDot = level.type === 'decimal';
    let entry = '';
    let attempts = 0;
    let done = false;

    const entryText = h('span', { class: 'entry__text' });
    const entryEl = h('div', {
      class: 'entry' + (isPercent ? ' entry--percent' : ''),
      dir: 'ltr', 'aria-live': 'polite',
    }, entryText, isPercent ? h('span', { class: 'entry__suffix' }, '%') : null);

    const paint = () => {
      entryText.textContent = entry === '' ? '?' : entry;
      entryEl.classList.toggle('is-empty', entry === '');
      entryEl.setAttribute('aria-label', entry === '' ? 'כתבו את הקפיצה' : formatValue(parseFloat(entry), level.type));
    };

    const rows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      [allowDot ? '.' : '', '0', 'back'],
    ];
    const pad = h('div', { class: 'keypad' });
    rows.flat().forEach((k) => {
      if (k === '') { pad.append(h('span', { class: 'keypad__spacer', 'aria-hidden': 'true' })); return; }
      const label = k === 'back' ? '⌫' : k;
      const aria = k === 'back' ? 'מחיקה' : k === '.' ? 'נקודה עשרונית' : k;
      const btn = h('button', { class: 'keypad__key', type: 'button', 'aria-label': aria }, label);
      btn.addEventListener('click', () => press(k));
      pad.append(btn);
    });
    const okBtn = h('button', { class: 'keypad__key keypad__key--ok', type: 'button', 'aria-label': 'אישור' }, '✓');
    okBtn.addEventListener('click', submit);

    consoleBody.innerHTML = '';
    consoleBody.append(h('div', { class: 'numpad' },
      h('div', { class: 'tray-title' }, 'כתבו את גודל הקפיצה'),
      entryEl, pad, okBtn,
    ));
    paint();

    function press(k) {
      if (done) return;
      sfx.click();
      if (k === 'back') { entry = entry.slice(0, -1); paint(); return; }
      if (k === '.') { if (!entry.includes('.')) entry += entry === '' ? '0.' : '.'; paint(); return; }
      if (entry.replace('.', '').length >= 7) return; // guard runaway input
      if (k === '0' && entry === '') return;          // no leading zero
      entry += k;
      paint();
    }

    function submit() {
      if (done || entry === '' || entry === '.') return;
      const value = parseFloat(entry);
      if (key(round(value)) === key(level.step)) {
        done = true;
        sfx.place();
        scoreApi.correct(Math.max(10, 30 - attempts * 10));
        entryEl.classList.add('is-correct');
        okBtn.disabled = true;
        cleanup();
        setTimeout(finish, 550);
      } else {
        sfx.wrong();
        scoreApi.mistake();
        attempts++;
        entryEl.classList.add('shake');
        setTimeout(() => { entryEl.classList.remove('shake'); entry = ''; paint(); }, 440);
      }
    }

    // Physical keyboard works too (nice on desktop; also lets tests drive it).
    function onKey(e) {
      if (done) return;
      if (e.key >= '0' && e.key <= '9') { press(e.key); e.preventDefault(); }
      else if (e.key === '.' && allowDot) { press('.'); e.preventDefault(); }
      else if (e.key === 'Backspace') { press('back'); e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === '=') { submit(); e.preventDefault(); }
    }
    window.addEventListener('keydown', onKey);
    function cleanup() { window.removeEventListener('keydown', onKey); }
  });
}

// --- tap-to-choose (fractions) ---
function runChoose({ level, building, consoleBody, banner, scoreApi }) {
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
        scoreApi.correct(Math.max(10, 30 - attempts * 10));
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

/** The real step plus 3 plausible fraction distractors, as multiple-choice options. */
function makeStepOptions(level) {
  const pool = [0.25, 0.5, 0.75, 1, level.step * 2, level.step / 2];
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
