# KMap — Campus Room Finder

KMap is a campus wayfinding demo for KIIT Campus 25. It models rooms and corridor connections as a weighted graph and uses Dijkstra’s algorithm to estimate a route across four floors.

## Run locally

Requirements: Node.js and npm.

```sh
npm run dev
```

Open http://localhost:3000. No npm install is needed; the server uses Node.js built-in modules. Press Ctrl+C to stop it.

## Project files

- `index.html`, `style.css` — page structure and styling.
- `app.js` — form handling, route instructions, and app startup.
- `rooms.json` — room lists by floor and block.
- `places.js` — entrances, washrooms, stairs, lifts, lecture theatres, offices, faculty chambers, and library locations.
- `graph.js` — room IDs and weighted graph construction. Adjacent room links use estimated weights from 10–25 steps; stair connections between floors use 50–80 steps.
- `dijkstra.js` — shortest-path algorithm.
- `renderer.js` — SVG floor-plan rendering and room positions.
- `server.js` — local static-file server.
- `test.js` — automated tests; run with `npm test`.
- `test-diag.html` — browser-based diagnostic page at http://localhost:3000/test-diag.html.

Step counts, floor connections, positions, and turn instructions are estimates based on the supplied plans. Verify them against actual corridor measurements before relying on the site for real navigation.
