export function findShortestPath(graph, start, destination) {
  if (!graph.has(start) || !graph.has(destination)) return null;
  const distance = new Map([...graph.keys()].map(node => [node, Infinity]));
  const previous = new Map();
  const previousWeight = new Map();
  const unvisited = new Set(graph.keys());
  distance.set(start, 0);

  while (unvisited.size) {
    let current = null;
    for (const node of unvisited) {
      if (current === null || distance.get(node) < distance.get(current)) current = node;
    }
    if (current === null || distance.get(current) === Infinity) break;
    if (current === destination) break;
    unvisited.delete(current);

    for (const edge of graph.get(current)) {
      if (!unvisited.has(edge.to)) continue;
      const candidate = distance.get(current) + edge.weight;
      if (candidate < distance.get(edge.to)) {
        distance.set(edge.to, candidate);
        previous.set(edge.to, current);
        previousWeight.set(edge.to, edge.weight);
      }
    }
  }

  if (start !== destination && !previous.has(destination)) return null;
  const path = [destination];
  while (path[0] !== start) {
    const parent = previous.get(path[0]);
    if (!parent) return null;
    path.unshift(parent);
  }
  return {
    path,
    legs: path.slice(1).map(node => previousWeight.get(node)),
    distance: distance.get(destination)
  };
}
