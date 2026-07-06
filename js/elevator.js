// elevator.js — animates the car between floors with door + travel choreography.
// Position is driven by the CSS custom property --car-index (floor index from
// the top), so it stays correct regardless of any responsive scaling.

import * as sfx from './audio.js';
import { formatValue } from './numbers.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function createElevator(building) {
  const { car } = building;
  const readout = car.querySelector('.car__readout-val');
  const rider = car.querySelector('.car__rider');
  let currentVal = null;

  const setReadout = (value) => { readout.textContent = formatValue(value, building.level.type); };

  function place(value) {
    currentVal = value;
    car.style.setProperty('--car-index', building.topIndexOf(value));
    setReadout(value);
  }

  function setRider(color) {
    if (color) { rider.style.background = color; rider.classList.add('is-on'); }
    else rider.classList.remove('is-on');
  }

  const openDoors = () => car.classList.add('is-open');
  const closeDoors = () => car.classList.remove('is-open');

  function countReadout(from, to, dur) {
    const dir = to > from ? 1 : -1;
    const total = Math.abs(to - from);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setReadout(building.desc[from + dir * i]);
      if (i >= total) clearInterval(id);
    }, dur / total);
    return id;
  }

  async function moveTo(value) {
    const from = building.topIndexOf(currentVal);
    const to = building.topIndexOf(value);
    const steps = Math.abs(to - from);
    if (steps === 0) { openDoors(); await wait(320); return; }

    closeDoors();
    await wait(280);

    const dur = Math.min(420 + steps * 170, 1700);
    sfx.travel(steps);
    car.style.setProperty('--move-dur', dur + 'ms');
    car.classList.add('is-moving');
    countReadout(from, to, dur);
    car.style.setProperty('--car-index', to);

    await wait(dur);
    currentVal = value;
    car.classList.remove('is-moving');
    setReadout(value);
    openDoors();
    await wait(340);
  }

  return { place, moveTo, setRider, openDoors, closeDoors, current: () => currentVal };
}
