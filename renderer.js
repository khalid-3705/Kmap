import { makeRoomId, roomFloor } from './graph.js';

const FLOOR_NAMES = ['Ground floor', 'First floor', 'Second floor', 'Third floor'];
const BLOCKS = ['A', 'B', 'C'];

export function floorConfig(floor, block) {
  if (floor === 0) return {
    A: { x: 90, y: 190, w: 300, h: 260, cols: 4 },
    B: { x: 500, y: 190, w: 300, h: 260, cols: 4 },
    C: { x: 390, y: 390, w: 100, h: 55, cols: 1 }
  }[block];
  return {
    A: { x: 95, y: 315, w: 285, h: 145, cols: 5 },
    B: { x: 160, y: 80, w: 390, h: 180, cols: 6 },
    C: { x: 600, y: 205, w: 205, h: 175, cols: 3 }
  }[block];
}

export function roomPoint(rooms, roomId) {
  if (!roomId || roomId.startsWith('GATE-')) return null;
  if (roomId.startsWith('LIBRARY-')) return [830, 300];
  const floor = roomFloor(roomId), block = roomId[0];
  const list = rooms[floor]?.[block] ?? [];
  const index = list.indexOf(roomId.slice(2));
  if (index < 0) return null;
  const config = floorConfig(floor, block);
  const cols = config.cols, row = Math.floor(index / cols), offset = index % cols;
  const col = row % 2 === 0 ? offset : cols - 1 - offset;
  const gap = 5, pad = 13;
  const width = (config.w - 2 * pad - gap * (cols - 1)) / cols;
  const height = Math.min(28, (config.h - 2 * pad - gap * (Math.ceil(list.length / cols) - 1)) / Math.ceil(list.length / cols));
  return [config.x + pad + col * (width + gap) + width / 2, config.y + pad + row * (height + gap) + height / 2];
}

export function drawFloorMap({ rooms, floor, route, start, destination, onRoomClick }) {
  const names = FLOOR_NAMES;
  document.querySelector('#floorname').textContent = names[floor];
  document.querySelector('#floorsub').textContent = floor === 0
    ? 'Blocks A and B · C Block entry'
    : 'Blocks A · B · C · similar layout';
  document.querySelector('#mapinfo').innerHTML = names[floor] + ' · floor plan<small>Room positions follow the supplied plans</small>';
  document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', Number(tab.dataset.f) === floor));

  const svg = document.querySelector('#plan');
  const shapes = [];
  for (const block of BLOCKS) {
    const list = (rooms[floor][block] ?? []).map(number => makeRoomId(floor, block, number));
    if (!list.length) continue;
    const config = floorConfig(floor, block), cols = config.cols, rows = Math.ceil(list.length / cols);
    const gap = 5, pad = 13, width = (config.w - 2 * pad - gap * (cols - 1)) / cols;
    const height = Math.min(28, (config.h - 2 * pad - gap * (rows - 1)) / rows);
    shapes.push(`<rect class="wall" x="${config.x}" y="${config.y}" width="${config.w}" height="${config.h}" rx="8"/><text class="blockLabel" x="${config.x + 8}" y="${config.y - 9}">BLOCK ${block}</text>`);
    list.forEach((room, index) => {
      const row = Math.floor(index / cols), offset = index % cols;
      const col = row % 2 === 0 ? offset : cols - 1 - offset;
      const x = config.x + pad + col * (width + gap), y = config.y + pad + row * (height + gap);
      const isEnd = room === start || room === destination;
      const className = isEnd ? 'roomEnd' : route.includes(room) ? 'roomPath' : 'roomRect';
      shapes.push(`<g class="roomNode" data-room="${room}" tabindex="0" role="button" aria-label="Choose ${room}"><rect class="${className}" x="${x}" y="${y}" width="${width}" height="${height}" rx="3"/><text class="roomText" x="${x + width / 2}" y="${y + height / 2 + 3}">${room}</text></g>`);
    });
  }

  const routeSegments = [];
  for (let i = 1; i < route.length; i++) {
    if (roomFloor(route[i - 1]) !== floor || roomFloor(route[i]) !== floor) continue;
    const a = roomPoint(rooms, route[i - 1]), b = roomPoint(rooms, route[i]);
    if (a && b) routeSegments.push(`<path d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}"/>`);
  }
  if (routeSegments.length) shapes.push(`<g class="routeLine">${routeSegments.join('')}</g>`);
  if (floor === 0) shapes.push('<path class="hall" d="M390 300 H500"/><text class="hallText" x="440" y="292">C block corridor</text><text class="entry" x="55" y="330">◉ A Block entry</text><text class="entry" x="790" y="470">◉ B Block entry</text>');
  else {
    shapes.push('<path class="hall" d="M380 365 H460 V295 H600 M350 260 V300 H460"/><text class="hallText" x="442" y="286">STAIRS · LIFTS</text><text class="entry" x="425" y="490">↓ Main gate / lower floors</text>');
    if (floor >= 2) {
      const library = `LIBRARY-${floor}`, selected = start === library || destination === library;
      shapes.push(`<g class="roomNode" data-room="${library}" tabindex="0" role="button" aria-label="Choose Library"><rect class="${selected ? 'roomEnd' : route.includes(library) ? 'roomPath' : 'roomRect'}" x="790" y="280" width="82" height="38" rx="6"/><text class="roomText" x="831" y="303">Library</text></g>`);
    }
  }
  svg.innerHTML = shapes.join('');
  svg.querySelectorAll('.roomNode').forEach(node => {
    const choose = () => onRoomClick(node.dataset.room);
    node.addEventListener('click', choose);
    node.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); }
    });
  });
}
