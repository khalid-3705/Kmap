import { buildGraph, roomFloor } from './graph.js';
import { findShortestPath } from './dijkstra.js';
import { drawFloorMap, roomPoint } from './renderer.js';

const rooms = await fetch('./rooms.json').then(response => {
  if (!response.ok) throw new Error('Could not load rooms.json');
  return response.json();
});
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
  ids.push('LIBRARY-2', 'LIBRARY-3');
  return ids;
}

const allRooms = roomIds();
document.querySelector('#room-list').innerHTML = allRooms.map(id =>
  `<option value="${id}">${id.startsWith('LIBRARY-') ? 'Library · Floor ' + roomFloor(id) : id + ' · Block ' + id[0] + ' · ' + (Number(id[1]) === 0 ? 'Ground floor' : 'Floor ' + id[1])}</option>`
).join('') + '<option value="GATE-A">A Block main entry</option><option value="GATE-B">B Block main entry</option>';
fromInput.value = 'A010';
toInput.value = 'C201';
graph = buildGraph(rooms);

function render() {
  drawFloorMap({ rooms, floor, route, start: fromInput.value, destination: toInput.value, onRoomClick: chooseRoom });
}
function chooseRoom(room) {
  if (!fromInput.value || toInput.value) { fromInput.value = toInput.value; toInput.value = room; }
  else toInput.value = room;
  render();
}
function turnAt(previous, current, next) {
  const a = roomPoint(rooms, previous), b = roomPoint(rooms, current), c = roomPoint(rooms, next);
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
  if (!allRooms.includes(start) && !['GATE-A', 'GATE-B'].includes(start)) return alert('Choose a starting room from the suggestions.');
  if (!allRooms.includes(destination) && !['GATE-A', 'GATE-B'].includes(destination)) return alert('Choose a destination from the suggestions.');
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
    let instruction;
    if (current.startsWith('GATE-')) instruction = `Start at the ${current === 'GATE-A' ? 'A' : 'B'} Block entry; go straight approximately ${steps} steps to ${next}.`;
    else if (roomFloor(current) !== roomFloor(next)) instruction = `Take the stairs or lift from ${current} to floor ${roomFloor(next)}; allow about ${steps} steps.`;
    else if (next.startsWith('LIBRARY-')) instruction = `From ${current}, follow the corridor toward the Library; walk approximately ${steps} steps.`;
    else if (current.startsWith('LIBRARY-')) instruction = `Leave the Library and follow the corridor toward ${next}; walk approximately ${steps} steps.`;
    else if (current[0] !== next[0]) instruction = `At ${current}, ${current[0] < next[0] ? 'turn right' : 'turn left'} toward Block ${next[0]}; walk approximately ${steps} steps to ${next}.`;
    else if (index === 0) instruction = `Start at ${current}; go straight approximately ${steps} steps to ${next}.`;
    else instruction = `At ${current}, ${turnAt(result.path[index - 1], current, next)}; walk approximately ${steps} steps to ${next}.`;
    return { room: next, instruction };
  });
  directions.push({ room: destination, instruction: `You have arrived at ${destination}.` });
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
