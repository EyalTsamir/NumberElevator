// elevator.js — places the car in the shaft and drives its floor readout.
// Position is driven by the CSS custom property --car-index (floor index from
// the top), so it stays correct regardless of any responsive scaling.

import { formatValue } from './numbers.js';

export function createElevator(building) {
  const { car } = building;
  const readout = car.querySelector('.car__readout-val');
  let currentVal = null;

  const setReadout = (value) => { readout.textContent = formatValue(value, building.level.type); };

  function place(value) {
    currentVal = value;
    building.el.style.setProperty('--car-index', building.topIndexOf(value));
    setReadout(value);
    building.scrollToIndex(building.topIndexOf(value));
  }

  const openDoors = () => car.classList.add('is-open');

  return { place, openDoors, current: () => currentVal };
}
