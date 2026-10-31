export function makeRoomId(floor, block, number) {
  return `${block}${floor}${number}`;
}

export function roomFloor(id) {
  if (!id) return 0;
  if (id.startsWith('ENTRY-') || id.startsWith('GATE-')) return 0;
  if (id.startsWith('LIBRARY-')) return Number(id.at(-1));
  if (/^(STAIR|LIFT|WC-|STAFF-|FACULTY-|SOCIETY-|THEATRE)/.test(id)) return Number(id.at(-1));
  return Number(id[1]);
}

export function buildGraph(rooms, places = []) {
  const graph = new Map();
  const addNode = id => { if (!graph.has(id)) graph.set(id, []); };
  const addEdge = (a, b, weight) => {
    if (!a || !b) return;
    addNode(a); addNode(b);
    graph.get(a).push({ to: b, weight });
    graph.get(b).push({ to: a, weight });
  };

  for (let floor = 0; floor <= 3; floor++) {
    for (const block of ['A', 'B', 'C']) {
      const ids = (rooms[floor][block] ?? []).map(number => makeRoomId(floor, block, number));
      ids.forEach((id, index) => {
        addNode(id);
        if (index > 0) {
          // Estimated corridor distance between neighboring room points: 10–25 steps.
          const weight = 10 + ((index * 7 + floor * 3 + block.charCodeAt(0)) % 16);
          addEdge(ids[index - 1], id, weight);
        }
      });
    }

    const a = rooms[floor].A.map(n => makeRoomId(floor, 'A', n));
    const b = rooms[floor].B.map(n => makeRoomId(floor, 'B', n));
    const c = rooms[floor].C.map(n => makeRoomId(floor, 'C', n));
    if (a.length && b.length) addEdge(a[Math.floor(a.length / 2)], b[0], 16);
    if (b.length && c.length) addEdge(b[Math.floor(b.length / 2)], c[0], 16);
  }

  for (const place of places) {
    addNode(place.id);
    addEdge(place.id, place.connectTo, place.steps ?? 15);
  }

  const verticalGroups = new Map();
  for (const place of places) {
    if (!place.verticalGroup) continue;
    if (!verticalGroups.has(place.verticalGroup)) verticalGroups.set(place.verticalGroup, []);
    verticalGroups.get(place.verticalGroup).push(place);
  }
  for (const group of verticalGroups.values()) {
    group.sort((a, b) => a.floor - b.floor);
    for (let i = 1; i < group.length; i++) {
      const lower = group[i - 1], upper = group[i];
      const weight = lower.type === 'stair'
        ? 50 + ((lower.floor * 11 + lower.block.charCodeAt(0)) % 31)
        : 12;
      addEdge(lower.id, upper.id, weight);
    }
  }
  return graph;
}
