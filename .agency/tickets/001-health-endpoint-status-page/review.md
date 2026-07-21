## QA — 2026-07-21

Server started with `node smoke-test/server.js` (PID 18947). Startup log:
```
smoke-test server listening on http://localhost:3000
```
Printed within ~1s of launch (well under the 5s AC5 bound).

- PASS — AC1: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health` prints `200`; `curl -sI http://localhost:3000/health | grep -i content-type` shows `application/json` — evidence:
```
$ curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/health
200
$ curl -sI http://localhost:3000/health | grep -i content-type
Content-Type: application/json
```

- PASS — AC2: `curl -s http://localhost:3000/health` returns JSON where `status === "ok"` and `typeof uptime_seconds === "number"` with `uptime_seconds >= 0` — evidence:
```
$ curl -s http://localhost:3000/health
{"status":"ok","uptime_seconds":5}
$ node -e 'const b=require("child_process").execSync("curl -s http://localhost:3000/health").toString(); const j=JSON.parse(b); console.log("parsed:", JSON.stringify(j)); if(j.status!=="ok"||typeof j.uptime_seconds!=="number"||j.uptime_seconds<0){console.log("FAIL"); process.exit(1)} else {console.log("PASS")}'
parsed: {"status":"ok","uptime_seconds":6}
PASS
```

- PASS — AC3: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/status` prints `200` with `Content-Type` containing `text/html`, and `curl -s http://localhost:3000/status | grep -ci uptime` outputs at least `1` — evidence:
```
$ curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/status
200
$ curl -sI http://localhost:3000/status | grep -i content-type
Content-Type: text/html; charset=utf-8
$ curl -s http://localhost:3000/status | grep -ci uptime
3
```

- PASS — AC4: `/` prints `200`, `/nope` prints `404` with JSON body containing key `error` (no regression) — evidence:
```
$ curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
200
$ curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/nope
404
$ curl -s http://localhost:3000/nope
{"error":"not found"}
```

- PASS — AC5: `smoke-test/` contains no `package.json` and no `node_modules/`, and the server starts with plain `node smoke-test/server.js` printing its `listening` line within 5 seconds — evidence:
```
$ ls -A /home/user/Agents/smoke-test/
README.md
server.js
$ node smoke-test/server.js
smoke-test server listening on http://localhost:3000
```
(listening line observed in captured server.log within ~1s of launch)

### Additional edge probes (not named by any AC, no breakage found)
```
$ curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/health
404
$ curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/health/../secret"
404
```
Both correctly fall through to the deny-by-default 404 JSON handler — no fix needed.

### Process cleanup
Started server PID 18947 via `node smoke-test/server.js`. Killed with `kill 18947`; confirmed via `ps aux | grep "[n]ode smoke-test/server.js"` returning no output — process fully terminated.

### Result
5/5 acceptance criteria PASS. No fix list required.

## Code review — 2026-07-21

Change surface (confirmed via `git diff 9750133 ffa2e50`): `smoke-test/server.js` modified (added `uptimeSeconds()`, `formatUptime()`, `statusPage()` helpers + `/health` and `/status` routes), `smoke-test/package.json` deleted (AC5). No unlisted product-code changes. `smoke-test/README.md` does NOT reference `package.json` (grep clean) and its `node server.js` run instruction still works, so the deletion leaves no stale reference — no finding.

### Findings

Blockers: none.
Majors: none.

| Severity | File:line | Finding | Why |
|----------|-----------|---------|-----|
| minor | smoke-test/server.js:23 | `formatUptime` always appends the seconds unit when days are absent, so exact-hour uptimes render as `1h 0s` / `2h 0s` / `1h 1m 0s` | Cosmetic noise only; not an AC violation (AC3 just requires the word "uptime" + a visible value). Verified: `0->0s`, `3600->1h 0s`, `90000->1d 1h`. |

### Security basics checklist (per changed file: smoke-test/server.js)

- (a) Secrets — PASS. `grep -niE '(api[_-]?key|secret|password|token|bearer|PRIVATE KEY|mongodb://|postgres://|mysql://|AKIA…)' smoke-test/server.js` → `no secrets found`. Static server, no credentials.
- (b) Injection — PASS. The only value interpolated into HTML is `uptimeText`, derived purely from `process.uptime()` → `Math.floor` → `formatUptime` (emits only digits and the literals d/h/m/s). No user input reaches the template. `req.url`/`req.method` are used only in exact-equality route matches, never interpolated into any SQL/shell/path/template. No SQL, no shell, no filesystem access. Path-traversal probe `GET /health/../secret` → `404` (deny-by-default).
- (c) Authz — PASS (per ticket scope). Endpoints are intentionally unauthenticated public liveness probes (`/health`, `/status`); ticket declares no auth requirement. No object access, no user-scoped data. Every non-matching route falls through to a deny-by-default 404 JSON. Negative probe `POST /health` → `404` (only exact `GET/HEAD` on the two routes are served).
- (d) Unsafe patterns — PASS. `grep -niE 'eval\(|exec\(|child_process|new Function|rejectUnauthorized' smoke-test/server.js` → `none found`. No TLS disabling, no CORS headers emitted (`curl -sI …/health | grep -i access-control` → `no CORS headers`, i.e. same-origin default), no file writes / world-writable files. Page is self-contained (`grep -cE '<script|https?://[^/]'` on `/status` body → `0`).

### Lint / test output

No lint tooling or test framework exists in this repo (no `package.json` anywhere by AC5, no Makefile/CI config); the dependency-free constraint forbids adding one. Lint equivalent is `node --check`; the AC curl gates are the integration tests. Both run green below.

```
$ node --check smoke-test/server.js
syntax OK

$ node smoke-test/server.js
smoke-test server listening on http://localhost:3000

=== AC1 ===
200
Content-Type: application/json
=== AC2 ===
{"status":"ok","uptime_seconds":1}
AC2 PASS
=== AC3 ===
200
Content-Type: text/html; charset=utf-8
grep uptime count: 3
=== AC4 ===
200
404
{"error":"not found"}
=== Negative: POST /health & traversal ===
404
404
=== Self-contained (grep -cE '<script|https?://[^/]') ===
0
=== CORS headers on /health ===
no CORS headers

server stopped cleanly
```

### Follow-up backlog suggestions (non-blocking)

1. `smoke-test/server.js:23` — `formatUptime` renders exact-hour uptimes with a trailing `0s` (e.g. `1h 0s`). Consider dropping trailing zero-value units for cleaner display. Cosmetic; ticket separately if desired.

VERDICT: PASS
