import { makeRoomId } from './graph.js';

const floorName = ['Ground floor', 'First floor', 'Second floor', 'Third floor'];

function makePlace(rooms, { id, label, mapLabel, type, floor, block = 'C', x, y, verticalGroup, steps, roomNumber }) {
  const roomList = rooms[floor][block] ?? [];
  const attachIndex = Math.min(Math.floor(roomList.length / 2), Math.max(0, roomList.length - 1));
  const attachedRoom = roomNumber && roomList.includes(roomNumber) ? roomNumber : roomList[attachIndex];
  return {
    id,
    label: `${label} · ${floorName[floor]}`,
    shortLabel: mapLabel ?? label,
    type,
    floor,
    block,
    x,
    y,
    connectTo: roomList.length ? makeRoomId(floor, block, attachedRoom) : null,
    verticalGroup,
    steps
  };
}

export function makePlaces(rooms) {
  const places = [];
  const coords = {
    0: {
      A: { stair: [335, 420], lift: [350, 300] },
      B: { stair: [550, 435], lift: [545, 205] },
      C: { stair: [425, 365], lift: [470, 365] }
    },
    1: {
      A: { stair: [360, 440], lift: [350, 350] },
      B: { stair: [540, 90], lift: [535, 185] },
      C: { stair: [470, 300], lift: [625, 340] }
    },
    2: {
      A: { stair: [360, 440], lift: [350, 350] },
      B: { stair: [540, 90], lift: [535, 185] },
      C: { stair: [470, 300], lift: [625, 340] }
    },
    3: {
      A: { stair: [360, 440], lift: [350, 350] },
      B: { stair: [540, 90], lift: [535, 185] },
      C: { stair: [470, 300], lift: [625, 340] }
    }
  };

  for (let floor = 0; floor <= 3; floor++) {
    for (const block of ['A', 'B', 'C']) {
      for (const kind of ['stair', 'lift']) {
        const [x, y] = coords[floor][block][kind];
        const label = kind === 'stair' ? 'Stairs' : 'Lift';
        places.push(makePlace(rooms, {
          id: `${kind === 'stair' ? 'STAIR' : 'LIFT'}-${block}-${floor}`,
          label: `${label} · Block ${block}`,
          mapLabel: `${kind === 'stair' ? 'Stair' : 'Lift'} ${block}`,
          type: kind,
          floor,
          block,
          x,
          y,
          verticalGroup: `${kind}-${block}`,
          steps: kind === 'stair' ? 14 : 12
        }));
      }
    }

    const sharedPlaces = [
      { id: `WC-LADIES-${floor}`, label: 'Ladies washroom', mapLabel: 'Ladies WC', type: 'washroom', block: 'A', x: 105, y: floor ? 290 : 180 },
      { id: `WC-GENTS-${floor}`, label: 'Gents washroom', mapLabel: 'Gents WC', type: 'washroom', block: 'B', x: floor ? 125 : 680, y: floor ? 85 : 465 },
      { id: `STAFF-TOILET-${floor}`, label: 'Staff toilet', mapLabel: 'Staff WC', type: 'washroom', block: 'C', x: 490, y: floor ? 400 : 380 }
    ];
    for (const item of sharedPlaces) places.push(makePlace(rooms, { ...item, floor, steps: 14 }));

    if (floor === 0) {
      for (const [block, x, y] of [['A', 60, 330], ['B', 805, 470], ['C', 445, 480]]) {
        places.push(makePlace(rooms, {
          id: `ENTRY-${block}`,
          label: `Block ${block} entry`,
          mapLabel: `Entry ${block}`,
          type: 'entry',
          floor,
          block,
          x,
          y,
          steps: 10
        }));
      }
    }

    if (floor >= 1) {
      const floorFacilities = [
        { id: `THEATRE4-${floor}`, label: 'Lecture Theatre 4 · C211', mapLabel: 'LT4', type: 'lecture', block: 'C', roomNumber: '11', x: 655, y: 415 },
        { id: `THEATRE5-${floor}`, label: 'Lecture Theatre 5 · C212', mapLabel: 'LT5', type: 'lecture', block: 'C', roomNumber: '12', x: 755, y: 415 },
        { id: `THEATRE6-${floor}`, label: 'Lecture Theatre 6 · C213', mapLabel: 'LT6', type: 'lecture', block: 'C', roomNumber: '13', x: 655, y: 455 }
      ];
      if (floor === 1) floorFacilities.push({ id: 'ADMIN-1', label: 'Dean / Admin office', mapLabel: 'Dean / Admin', type: 'office', block: 'C', x: 810, y: 375 });
      if (floor === 2) floorFacilities.push(
        { id: 'FACULTY-2', label: 'Faculty chambers · C201', mapLabel: 'Faculty', type: 'faculty', block: 'C', roomNumber: '01', x: 810, y: 345 },
        { id: 'SOCIETY-2', label: 'Society office · C203', mapLabel: 'Society office', type: 'office', block: 'C', roomNumber: '03', x: 810, y: 375 }
      );
      for (const item of floorFacilities) places.push(makePlace(rooms, { ...item, floor, steps: 15 }));
    }
  }

  for (const floor of [2, 3]) {
    places.push(makePlace(rooms, {
      id: `LIBRARY-${floor}`,
      label: `Library · ${floorName[floor]}`,
      mapLabel: 'Library',
      type: 'library',
      floor,
      block: 'C',
      x: 830,
      y: 300,
      roomNumber: '01',
      steps: 15
    }));
  }
  return places;
}
