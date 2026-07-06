// main.js — app entry + screen router.

import { clear } from './ui.js';
import { unlock } from './audio.js';
import { renderHome, renderSelect, renderComplete } from './screens.js';
import { renderGame } from './game.js';

const app = document.getElementById('app');

const routes = {
  home: renderHome,
  select: renderSelect,
  game: renderGame,
  complete: renderComplete,
};

let current = { screen: 'home', params: {} };

export function navigate(screen, params = {}) {
  current = { screen, params };
  render();
}

function render() {
  clear(app);
  app.dataset.screen = current.screen;
  const node = routes[current.screen]({ navigate, params: current.params });
  app.append(node);
  window.scrollTo(0, 0);
}

// Browsers require a user gesture before audio can play — unlock on first tap.
window.addEventListener('pointerdown', () => unlock(), { once: true });

render();
