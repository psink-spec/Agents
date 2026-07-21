# Ticket 001: Health endpoint + HTML status page for smoke-test app

## Problem statement
Anyone running the agency pipeline smoke test has no way to verify that the smoke-test server (`smoke-test/server.js`) is alive or how long it has been running — the server only answers `/` and 404s everything else. Automated gates cannot probe it for liveness, and humans cannot glance at a status page. This blocks using the app as a reliable end-to-end pipeline smoke test.

## User story
As an agency pipeline operator, I want a machine-readable `/health` endpoint and a tiny human-readable status page showing uptime, so that both gate agents and humans can confirm the smoke-test server is up without reading logs.

## Acceptance criteria
Every item must be binary and testable — a gate agent must be able to prove PASS or FAIL with a command, a measurement, or a file inspection. No "works well", no "looks good".

- [ ] AC1: With the server running (`node smoke-test/server.js`), `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health` prints `200`, and `curl -sI http://localhost:3000/health | grep -i content-type` shows `application/json`.
- [ ] AC2: `curl -s http://localhost:3000/health` returns a JSON body where `JSON.parse(body).status === "ok"` and `typeof JSON.parse(body).uptime_seconds === "number"` with `uptime_seconds >= 0` (verifiable via `node -e 'const b=require("child_process").execSync("curl -s http://localhost:3000/health").toString(); const j=JSON.parse(b); if(j.status!=="ok"||typeof j.uptime_seconds!=="number"||j.uptime_seconds<0) process.exit(1)'`).
- [ ] AC3: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/status` prints `200` with `Content-Type` containing `text/html`, and `curl -s http://localhost:3000/status | grep -ci uptime` outputs at least `1` (the page displays the server's uptime).
- [ ] AC4: No regression: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` prints `200`, and `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/nope` prints `404` with a JSON body containing key `error`.
- [ ] AC5: Dependency-free: after the change, `smoke-test/` contains no `package.json` and no `node_modules/` directory (`ls smoke-test/` shows neither), and the server starts with plain `node smoke-test/server.js` printing its `listening` line within 5 seconds.

## Constraints
- Stack: plain Node.js core modules only (`http` etc.) — no npm installs, no new files beyond what the build needs; HTML/CSS for the status page must be inline/self-contained.
- Deadline: none
- Budget: keep it small — this is a smoke-test subject, not a product; target well under ~100 added lines.
- Other: must not change the port (3000 / `process.env.PORT`), the existing `/` response, or the 404 JSON behavior; `module.exports = server` must remain.

## Priority
P0 — RICE: Reach ~5 pipeline operators+agents/quarter × Impact 3 (blocks pipeline smoke test = blocks validating all shipped work) × Confidence 100% ÷ Effort 0.25 weeks = 60; it is the pipeline smoke test, which forces P0 regardless.

## Status
READY_FOR_BUILD

<!-- Allowed statuses:
DRAFT | READY_FOR_DESIGN | READY_FOR_BUILD | IN_BUILD | READY_FOR_QA |
IN_REVIEW | NEEDS_REVISION | BLOCKED | READY_TO_SHIP | DONE
Only project-shipper may set DONE. Anyone may set BLOCKED (with a reason). -->
