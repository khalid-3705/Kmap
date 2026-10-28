# KMap — Campus Room Finder

KMap is a small campus wayfinding demo for KIIT Campus 25. It uses a weighted graph and Dijkstra's algorithm to estimate a route between rooms across the ground, first, second, and third floors.

## Run locally

Requirements: Node.js and npm.

```sh
npm run dev
```

Open <http://localhost:3000>. No package installation is needed; the server uses Node.js built-in modules. Press Ctrl+C to stop it.

## Project files

- `index.html` — user interface, room data, floor map, graph construction, Dijkstra route search, and estimated directions.
- `server.js` — local static-file server.
- `package.json` — npm run scripts.

## Route model

Rooms are graph nodes. Corridor, block, entry, and floor-change links are weighted edges. Dijkstra chooses the route with the lowest estimated step cost. The floor plan positions and step counts are illustrative and should be checked against measured campus routes before being used for real navigation.
