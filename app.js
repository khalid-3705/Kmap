import { buildGraph, roomFloor } from './graph.js';
import { findShortestPath } from './dijkstra.js';
import { drawFloorMap, roomPoint } from './renderer.js';
import { makePlaces } from './places.js';

const rooms = await fetch('./rooms.json').then(response => {
  if (!response.ok) throw new Error('Could not load rooms.json');
  return response.json();
});
const places = makePlaces(rooms);
const placeById = new Map(places.map(place => [place.id, place]));
const floorNames = ['Ground floor', 'First floor', 'Second floor', 'Third floor'];
const floorTabs = document.querySelectorAll('.tab');
const fromInput = document.querySelector('#from');
const toInput = document.querySelector('#to');
let floor = 0;
let route = [];
let graph;

function roomIds() {
  const ids = [];
  for (let currentFloor = 0; currentFloor <= 3; currentFloor++) {
    for (const block of ['A', 'B', 'C']) {
      for (const number of rooms[currentFloor][block]) ids.push(`${block}${currentFloor}${number}`);
    }
  }
  return [...ids, ...places.map(place => place.id)];
}

const allRooms = roomIds();
document.querySelector('#room-list').innerHTML = allRooms.map(id =>
  `<option value="${id}">${placeById.has(id) ? placeById.get(id).label : `${id} · Block ${id[0]} · ${Number(id[1]) === 0 ? 'Ground floor' : 'Floor ' + id[1]}`}</option>`
).join('');
fromInput.value = 'A010';
toInput.value = 'C201';
graph = buildGraph(rooms, places);

function render() {
  drawFloorMap({ rooms, places, floor, route, start: fromInput.value, destination: toInput.value, onRoomClick: chooseRoom });
}
function chooseRoom(room) {
  if (!fromInput.value || toInput.value) { fromInput.value = toInput.value; toInput.value = room; }
  else toInput.value = room;
  render();
}
function turnAt(previous, current, next) {
  const a = roomPoint(rooms, previous, places), b = roomPoint(rooms, current, places), c = roomPoint(rooms, next, places);
  if (!a || !b || !c) return 'go straight';
  const ax = b[0] - a[0], ay = b[1] - a[1], bx = c[0] - b[0], by = c[1] - b[1];
  const cross = ax * by - ay * bx, dot = ax * bx + ay * by;
  const norm = Math.hypot(ax, ay) * Math.hypot(bx, by);
  if (norm && dot / norm < 0.72) return cross > 0 ? 'turn right' : 'turn left';
  return 'go straight';
}
function findRoute() {
  const start = fromInput.value.trim().toUpperCase();
  const destination = toInput.value.trim().toUpperCase();
  fromInput.value = start; toInput.value = destination;
  if (!allRooms.includes(start)) return alert('Choose a starting room or facility from the suggestions.');
  if (!allRooms.includes(destination)) return alert('Choose a destination room or facility from the suggestions.');
  if (start === destination) return alert('Choose two different locations.');
  const result = findShortestPath(graph, start, destination);
  if (!result) return alert('No route could be found.');
  route = result.path;
  floor = roomFloor(start);
  document.querySelector('#result').classList.add('show');
  document.querySelector('#distance').textContent = result.distance;
  document.querySelector('#count').textContent = result.legs.length;

  const directions = result.path.slice(0, -1).map((current, index) => {
    const next = result.path[index + 1], steps = result.legs[index];
    const currentPlace = placeById.get(current), nextPlace = placeById.get(next);
    const currentName = currentPlace?.label ?? current;
    const nextName = nextPlace?.label ?? next;
    let instruction;
    if (currentPlace?.type === 'entry') instruction = `Start at ${currentPlace.label}; walk approximately ${steps} steps toward ${nextName}.`;
    else if (roomFloor(current) !== roomFloor(next)) {
      const connector = currentPlace?.type === 'stair' ? 'Take the stairs' : currentPlace?.type === 'lift' ? 'Take the lift' : 'Change floors';
      instruction = `${connector} from ${currentName} to ${floorNames[roomFloor(next)]}; allow approximately ${steps} steps.`;
    }
    else if (nextPlace) instruction = `Follow the corridor toward ${nextPlace.label}; walk approximately ${steps} steps.`;
    else if (currentPlace) instruction = `From ${currentPlace.label}, ${turnAt(result.path[index - 1], current, next)} toward ${next}; walk approximately ${steps} steps.`;
    else if (current[0] !== next[0]) instruction = `At ${current}, ${current[0] < next[0] ? 'turn right' : 'turn left'} toward Block ${next[0]}; walk approximately ${steps} steps to ${next}.`;
    else if (index === 0) instruction = `Start at ${current}; go straight approximately ${steps} steps to ${next}.`;
    else instruction = `At ${current}, ${turnAt(result.path[index - 1], current, next)}; walk approximately ${steps} steps to ${next}.`;
    return { room: nextName, instruction };
  });
  directions.push({ room: placeById.get(destination)?.label ?? destination, instruction: `You have arrived at ${placeById.get(destination)?.label ?? destination}.` });
  document.querySelector('#steps').innerHTML = directions.map((item, index) =>
    `<div class="step"><span class="dot">${index === directions.length - 1 ? '✓' : index + 1}</span><span><b>${item.room}</b><br>${item.instruction}</span></div>`
  ).join('');
  render();
}

document.querySelector('#find').addEventListener('click', findRoute);
document.querySelector('#swap').addEventListener('click', () => {
  [fromInput.value, toInput.value] = [toInput.value, fromInput.value]; render();
});
floorTabs.forEach(tab => tab.addEventListener('click', () => { floor = Number(tab.dataset.f); render(); }));
fromInput.addEventListener('input', render);
toInput.addEventListener('input', render);
render();
findRoute();
