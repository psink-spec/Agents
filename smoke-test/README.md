# Smoke Test App

Minimal dependency-free Node server. Exists so The Agency's pipeline has a real product to build against.

Run: `node server.js` (PORT env var optional, default 3000). No install step — there is deliberately no `package.json` and no `node_modules/`; the server uses Node core modules only.

## Endpoints

- `GET /` — original hello page (HTML).
- `GET /health` — machine-readable liveness probe. Returns `200` with `Content-Type: application/json` and body `{"status":"ok","uptime_seconds":<integer>}` (`uptime_seconds` is whole seconds, always >= 0). `HEAD` is also supported.
- `GET /status` — human-readable status page. Returns `200` with `Content-Type: text/html; charset=utf-8`; a self-contained HTML page (inline CSS, no external assets or client JS) showing the server's uptime — the same value `/health` reports. `HEAD` is also supported.
- Anything else — `404` with JSON body `{"error":"not found"}` (deny-by-default; only exact `GET`/`HEAD` on the routes above are served).
