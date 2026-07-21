# Changelog

## 2026-07-21 — 001 Health endpoint + HTML status page for smoke-test app

- Added `GET /health` to `smoke-test/server.js`: machine-readable liveness probe returning `{"status":"ok","uptime_seconds":<integer>}` as `application/json` (HEAD supported).
- Added `GET /status`: self-contained HTML status page (inline CSS, no client JS, no external assets) showing the server's uptime from the same source as `/health` (HEAD supported).
- Removed `smoke-test/package.json` — the smoke-test app is now fully dependency-free; run with plain `node smoke-test/server.js`. Existing `/` response and 404 JSON behavior unchanged.
