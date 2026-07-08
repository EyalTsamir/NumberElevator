// ui.js — tiny DOM helpers and shared widgets used across screens.

import { isMuted, toggleMuted } from './state.js';
import * as sfx from './audio.js';

/** Hyperscript-style element builder. h('div',{class:'x',onClick:fn}, child, 'text') */
export function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k === 'style' && typeof v === 'object') {
      for (const [prop, val] of Object.entries(v)) {
        if (prop.startsWith('--')) node.style.setProperty(prop, String(val));
        else node.style[prop] = val;
      }
    }
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) node.setAttribute(k, '');
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

/** A row of stars, `filled` of `total` lit. */
export function stars(filled, total = 3) {
  const row = h('div', { class: 'stars', 'aria-label': `${filled} מתוך ${total} כוכבים` });
  for (let i = 0; i < total; i++) {
    row.append(h('span', { class: 'star' + (i < filled ? ' star--on' : ''), 'aria-hidden': 'true' }, '★'));
  }
  return row;
}

/** Big tactile button. variant: 'primary' | 'accent' | 'ghost'. */
export function button(label, onClick, { variant = 'primary', size = 'md', icon = null } = {}) {
  return h('button', { class: `btn btn--${variant} btn--${size}`, type: 'button', onClick },
    icon ? h('span', { class: 'btn__icon', 'aria-hidden': 'true' }, icon) : null,
    h('span', { class: 'btn__label' }, label));
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

/** Round mute/unmute toggle that reflects and updates the saved preference. */
export function muteToggle() {
  const btn = h('button', { class: 'icon-btn mute', type: 'button', title: 'צליל' });
  const paint = () => {
    const muted = isMuted();
    btn.classList.toggle('is-muted', muted);
    btn.setAttribute('aria-label', muted ? 'הפעל צליל' : 'השתק צליל');
    btn.textContent = muted ? '🔇' : '🔊';
  };
  btn.addEventListener('click', () => { const m = toggleMuted(); if (!m) sfx.click(); paint(); });
  paint();
  return btn;
}

/**
 * Fullscreen toggle: with no page-level scroll, mobile browsers never get the
 * gesture they use to auto-hide their own address bar, so on a short phone it
 * permanently eats into the game's height. The Fullscreen API reclaims that
 * space, but browsers only allow entering it from a real tap (never on load),
 * so this is a button, not something automatic. Returns null where unsupported
 * (notably iPhone Safari) rather than rendering a button that can't do anything.
 */
export function fullscreenToggle() {
  if (!document.documentElement.requestFullscreen) return null;
  const btn = h('button', { class: 'icon-btn', type: 'button', title: 'מסך מלא' });
  const paint = () => {
    const isFull = !!document.fullscreenElement;
    btn.setAttribute('aria-label', isFull ? 'צאו ממסך מלא' : 'הפעילו מסך מלא — לראות יותר מהבניין');
    btn.textContent = isFull ? '⤢' : '⛶';
  };
  btn.addEventListener('click', () => {
    sfx.click();
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  });
  document.addEventListener('fullscreenchange', paint);
  paint();
  return btn;
}
