// audio.js — all sound effects synthesized with the Web Audio API (no asset files).
// Sounds are intentionally short, soft and cheerful. Everything is muted by the
// player's saved preference, and the context is created lazily on first gesture
// (browsers block audio until a user interaction).

import { isMuted } from './state.js';

let ctx = null;
let master = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Call once from the first user gesture so later sounds are allowed to play. */
export function unlock() {
  try { ac(); } catch (_) { /* no audio support */ }
}

function note(freq, start, dur, { type = 'sine', peak = 0.2, glideTo = null } = {}) {
  const c = ac();
  const t0 = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (glideTo) o.frequency.linearRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.03);
}

function play(fn) {
  if (isMuted()) return;
  try { fn(); } catch (_) { /* ignore audio glitches */ }
}

// UI tap
export function click() {
  play(() => note(320, 0, 0.08, { type: 'triangle', peak: 0.12 }));
}

// A tile placed correctly — soft pop
export function place() {
  play(() => {
    note(523, 0, 0.1, { type: 'triangle', peak: 0.16 });
    note(784, 0.05, 0.12, { type: 'sine', peak: 0.14 });
  });
}

// Wrong answer — gentle "try again", never harsh
export function wrong() {
  play(() => {
    note(300, 0, 0.14, { type: 'sawtooth', peak: 0.1, glideTo: 200 });
    note(200, 0.12, 0.16, { type: 'sine', peak: 0.1, glideTo: 160 });
  });
}

// Streak combo — a short sparkle that rises with the streak length
export function combo(streak = 2) {
  play(() => {
    const base = 660 + Math.min(streak, 6) * 70;
    note(base, 0, 0.1, { type: 'triangle', peak: 0.12 });
    note(base * 1.5, 0.05, 0.12, { type: 'sine', peak: 0.09 });
  });
}

// Level complete — happy little fanfare
export function win() {
  play(() => {
    const seq = [523, 659, 784, 1047]; // C E G C
    seq.forEach((f, i) => note(f, i * 0.13, 0.4, { type: 'triangle', peak: 0.2 }));
    note(1319, 0.52, 0.6, { type: 'sine', peak: 0.16 });
  });
}
