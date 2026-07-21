# UX Architecture — Ticket 001: `/status` HTML page

Scope per handoff: ONLY the human-facing `GET /status` page. `/health` is a fixed machine
contract (no UI). `/` and 404 behavior are frozen (AC4). Everything must be served inline
from `smoke-test/server.js` — no external assets, no JS required for correctness (AC5,
constraints). This is a one-page status view; the spec is deliberately small.

## User goals & entry points

| # | Goal (from ticket) | Entry point |
|---|--------------------|-------------|
| 1 | Human operator confirms the smoke-test server is up and sees how long it has been running | Direct URL `http://localhost:3000/status` (typed, bookmarked, or linked from pipeline docs) |

One goal → one flow. (Machine liveness via `/health` is a second ticket goal but has no
UI — handled by build, not UX.)

## Flow 1: Check server status

1. **Entry** — Operator requests `GET /status` in a browser.
2. **System** — Server responds `200`, `Content-Type: text/html; charset=utf-8`, with a
   single self-contained HTML document (all CSS inline in a `<style>` block, no `<img>`,
   no `<link>`, no `<script>` needed).
3. **Screen: Status page** (single screen, no navigation) shows, top to bottom:
   - Page title: `Smoke Test — Status` (also the `<title>`).
   - **Status line**: a colored dot/badge + the word `OK`. If the server can render this
     page at all it is by definition up, so the badge is always the "ok" state — do not
     invent unreachable "down" UI.
   - **Uptime line**: label `Uptime` + human-readable value derived from the same source
     `/health` uses, e.g. `3m 42s` (rules below). The literal word "Uptime" must appear
     in the HTML — AC3 greps case-insensitively for `uptime`.
   - **Footnote**: link text `machine-readable: /health` as a plain `<a href="/health">`,
     so humans can find the JSON contract. This is the page's only link.
4. **Exit** — Operator reads the page and leaves or refreshes (F5). Refresh re-runs
   steps 1–3 with a fresh uptime value. No auto-refresh (optional polish per
   sprint-prioritizer; NOT required — do not add JS for it).

### Uptime display rules
- Compute whole seconds from the same value `/health` reports (`uptime_seconds`), never
  a second clock — the human page and the machine page must never disagree.
- Format: largest-first units, skip leading zero units: `47s` → `3m 42s` → `1h 03m 12s`
  → `2d 5h`. Seconds may be dropped once days are shown. A simple `Xm Ys`/`Xs` two-tier
  format is acceptable if the builder wants fewer lines — the only hard rule is the
  `0s` case below.

### Edge states (all five, per house rule)
- **Empty (just restarted, uptime 0s)** — uptime rounds to 0 whole seconds. Show `0s`
  (never blank, never `-0s`, never an empty value after the `Uptime` label). AC2 allows
  `uptime_seconds >= 0`, so 0 is a legitimate value the page must render.
- **Error** — N/A because the page has no actions that can fail: it is a static
  server-rendered document with no forms or fetches. If the server itself errors, no
  page is served at all (browser connection error), which is outside this page's UI.
- **Loading** — N/A because the response is a single tiny HTML string generated in
  memory; there is no async data fetch and nothing to show a spinner for. (Corollary
  for build: no client-side JS data loading — render uptime into the HTML server-side.)
- **Unauthorized** — N/A because the ticket defines no auth; the server is a local
  smoke-test subject on localhost:3000, open by design.
- **Abandoned** — N/A because the flow is a single read-only screen with no state to
  lose; closing the tab has no consequences.

## Information architecture / route map

| Route | Method | Type | Owner |
|-------|--------|------|-------|
| `/` | GET | existing HTML hello page — DO NOT CHANGE (AC4) | frozen |
| `/health` | GET | JSON machine contract — no UI (AC1/AC2) | build |
| `/status` | GET | this page — human status view (AC3) | this spec |
| anything else | any | existing JSON 404 `{"error":"not found"}` — DO NOT CHANGE (AC4) | frozen |

Hierarchy: flat. `/status` is a leaf page with exactly one outbound link (`/health`).
No nav bar, no link added to `/` (changing `/` would risk AC4).

Label justifications: `Uptime` is standard ops vocabulary and required by AC3's grep;
`machine-readable: /health` says what the link is for so a first-time operator doesn't
expect another human page.

## CSS system architecture

Proportionate to a single inline `<style>` block (~15–25 declarations). Still ordered
as layers so it reads as a system:

1. **Tokens** — no `design-tokens.md` exists for this ticket, so define these inline as
   CSS custom properties on `:root` (single source of truth inside the style block):
   - `--color-bg: #ffffff; --color-fg: #1a1a1a; --color-ok: #16a34a;`
   - `--color-muted: #6b7280; --space: 1rem; --radius: 999px;`
   - Font: system stack only (`font-family: system-ui, sans-serif;`) — no webfonts (constraint).
2. **Base** — `body` only: system font, `--color-fg` on `--color-bg`, centered
   `max-width` column, `--space` padding.
3. **Components** — class naming: simple BEM-lite, prefix `status-`. Exactly three
   components; two concrete examples of the convention:
   - `.status-badge` — inline-flex pill, `--color-ok` dot (a bordered/`background`
     `::before` circle or bullet char, NOT an image), bold `OK` text.
   - `.status-uptime` — definition-style row: muted `Uptime` label (`--color-muted`),
     large monospaced value (`font-family: ui-monospace, monospace`).
   - (third: `.status-footnote` — small muted link line.)
4. **Utilities** — none. A page this size earns no utility layer; add nothing here.

Cascade rules: single-class selectors only, no IDs, no `!important`, max specificity
0-1-1 (`.status-badge::before`). Components read only from the `:root` tokens — no raw
hex outside the tokens block. Dark mode: out of scope (smoke-test subject, budget).

Build note: keep the whole HTML+CSS string small — ticket budget is well under ~100
added lines for the entire change including `/health`; target roughly 30 lines for the
`/status` template.

## Acceptance notes (Flow 1) — for QA

- A1 (maps to AC3): `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/status`
  prints `200` and the `Content-Type` header contains `text/html`.
- A2 (maps to AC3): `curl -s http://localhost:3000/status | grep -ci uptime` ≥ 1, and the
  rendered page shows a non-empty uptime value next to the `Uptime` label (e.g. `12s`).
- A3 (edge: just restarted): killing and restarting the server, then fetching `/status`
  within the first second, renders `0s` (or `1s`) — never a blank value after `Uptime`.
- A4 (self-contained): the `/status` response body contains no `http://` or `https://`
  URLs, no `<script src>`, `<link>`, or `<img>` tags — `curl -s http://localhost:3000/status | grep -cE '<script|<link|<img|https?://'`
  outputs `0`; the only anchor is the relative `/health` link.
- A5 (maps to AC4): after the change, `/` still returns its original body with `200` and
  `/nope` still returns `404` JSON with key `error`.

## Self-check record
- (a) All five edge states present in Flow 1: empty branched (0s rule); error, loading,
  unauthorized, abandoned each marked N/A with reasons. PASS.
- (b) Acceptance notes are verifiable commands/observations, no intent language. PASS.
- (c) Developer read-through: every step names a concrete route (`/status`), component
  (`.status-badge`, `.status-uptime`, `.status-footnote`), or header. PASS.
