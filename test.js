import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildGraph, makeRoomId } from './graph.js';
import { findShortestPath } from './dijkstra.js';
import { makePlaces } from './places.js';
const rooms = JSON.parse(await readFile(new URL('./rooms.json', import.meta.url), 'utf8'));
const graph = buildGraph(rooms, makePlaces(rooms));
test('room IDs use block, floor, and two-digit room number', () => {
  assert.equal(makeRoomId(0, 'A', '12'), 'A012');
  assert.equal(makeRoomId(1, 'B', '06'), 'B106');
});
test('graph contains rooms and all edges have nonnegative weights', () => {
  assert.ok(graph.has('A010'));
  assert.ok(graph.has('C201'));
  for (const edges of graph.values()) for (const edge of edges) assert.ok(edge.weight >= 0);
});
test('Dijkstra returns a connected route across blocks and floors', () => {
  const route = findShortestPath(graph, 'A010', 'C201');
  assert.ok(route);
  assert.equal(route.path[0], 'A010');
  assert.equal(route.path.at(-1), 'C201');
  assert.equal(route.legs.reduce((sum, leg) => sum + leg, 0), route.distance);
});
test('same start and destination has zero cost', () => {
  const route = findShortestPath(graph, 'A010', 'A010');
  assert.deepEqual(route.path, ['A010']);
  assert.equal(route.distance, 0);
});
