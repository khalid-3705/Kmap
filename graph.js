export const GATES = ['GATE-A', 'GATE-B'];

export function makeRoomId(floor, block, number) {
  return `${block}${floor}${number}`;
}

export function roomFloor(roomId) {
  if (roomId.startsWith('GATE-')) return 0;
  if (roomId.startsWith('LIBRARY-')) return Number(roomId.at(-1));
  return Number(roomId[1]);
}

export function buildGraph(rooms) {
  const graph = new Map();
  const addNode = (id) => { if (!graph.has(id)) graph.set(id, []); };
  const addEdge = (a, b, weight) => {
    addNode(a); addNode(b);
    graph.get(a).push({ to: b, weight });
    graph.get(b).push({ to: a, weight });
  };

  for (let floor = 0; floor <= 3; floor++) {
    for (const block of ['A', 'B', 'C']) {
      const ids = rooms[floor][block].map(number => makeRoomId(floor, block, number));
      ids.forEach((id, index) => {
        addNode(id);
        if (index > 0) {
          const weight = 5 + ((index * 7 + floor * 3 + block.charCodeAt(0)) % 11);
          addEdge(ids[index - 1], id, weight);
        }
      });
      if (floor === 0 && ids.length) {
        const gate = block === 'A' ? 'GATE-A' : 'GATE-B';
        addEdge(gate, ids[0], 8);
      }
    }

    const a = rooms[floor].A.map(n => makeRoomId(floor, 'A', n));
    const b = rooms[floor].B.map(n => makeRoomId(floor, 'B', n));
    const c = rooms[floor].C.map(n => makeRoomId(floor, 'C', n));
    if (a.length && b.length) addEdge(a[Math.floor(a.length / 2)], b[0], 9);
    if (b.length && c.length) addEdge(b[Math.floor(b.length / 2)], c[0], 8);
  }

  // The supplied second-floor plan marks the library beside C Block; the
  // supplied plans show the same layout on floors 1–3.
  for (const floor of [2, 3]) {
    const library = `LIBRARY-${floor}`;
    const cRooms = rooms[floor].C;
    if (cRooms.length) addEdge(library, makeRoomId(floor, 'C', cRooms[0]), 12);
  }

  // Matching corridor locations connect floors via stairs or lifts.
  for (const block of ['A', 'B', 'C']) {
    for (let floor = 0; floor < 3; floor++) {
      const lower = rooms[floor][block];
      const upper = rooms[floor + 1][block];
      if (!lower.length || !upper.length) continue;
      const lowerRoom = lower[Math.floor(lower.length / 2)];
      const upperRoom = upper[Math.floor(upper.length / 2)];
      addEdge(makeRoomId(floor, block, lowerRoom), makeRoomId(floor + 1, block, upperRoom), 28);
    }
  }
  return graph;
}
