# UI Spec — Ticket 001: `/status` page

Companion to ux-architecture.md (flow/IA) and design-tokens.md (all values). Every
visual value below is a token reference — raw colors/pixel values are banned outside
the tokens file. Implementable as ONE inline `<style>` block in the HTML string served
by `smoke-test/server.js`; no external assets, no client JS, no images (the dot is a
CSS `::before` circle).

## Style-block architecture (cascade contract)

Order inside the single `<style>` block — tokens → base → components. No utility
layer, no IDs, no `!important`. Specificity cap 0-1-1 (one class OR one pseudo-class,
plus at most one element/pseudo-element — e.g. `.status-badge::before`,
`.status-uptime strong`, `a:focus-visible`). Builder may pack multiple declarations
per line to respect the ticket's ~100-line budget; target roughly 30 lines for the
whole `/status` template.

1. `:root { ... }` — the 14 tokens from design-tokens.md, transcribed verbatim.
2. Base — `body`, `a`, `a:hover`, `a:focus-visible` (element/pseudo selectors only;
   the page has exactly one anchor, so element-level link styling is safe and keeps
   specificity at or below the cap).
3. Components — `.status-badge` (+ `::before`), `.status-uptime` (+ `strong`),
   `.status-footnote`.

## Screen: Status page (`GET /status`) — maps to AC3

Single centered column, no navigation, no breakpoints needed (content is narrower
than any viewport; the column max-width handles large screens, and everything wraps
naturally below it — verify nothing overflows at 320 CSS pixels wide).

Layout, top to bottom (content priority = DOM order = visual order):

| # | Element | Component | Content |
|---|---|---|---|
| 1 | `<title>` | — | `Smoke Test — Status` |
| 2 | `<h1>` | base | `Smoke Test — Status` (default `h1` size, `--color-fg`) |
| 3 | Status line | `.status-badge` | dot + `OK` |
| 4 | Uptime line | `.status-uptime` | `Uptime` label + value, e.g. `3m 42s` |
| 5 | Footnote | `.status-footnote` | link `machine-readable: /health` |

### Base: `body`
- `font-family: var(--font-sans)`; `color: var(--color-fg)`;
  `background: var(--color-bg)`.
- Centered column: `max-width: 24rem; margin: 0 auto; padding: calc(var(--space) * 2) var(--space)`.
- Vertical rhythm: rely on default block margins plus `margin-block: var(--space)` on
  the three components (or a `display: grid; gap: var(--space)` body — builder's
  choice, same visual result).

### Base: links (`a`, `a:hover`, `a:focus-visible`)
- `a`: `color: var(--color-muted); text-decoration: underline` (underline kept —
  color alone may not signal a link at AA).
- `a:hover`: `color: var(--color-fg)`.
- `a:focus-visible`: `outline: var(--focus-ring); outline-offset: calc(var(--space-sm) / 4); border-radius: var(--radius)`.
- Tap target: the link is inline text; give it `display: inline-block; padding: var(--space-sm) 0`
  so the hit area reaches at least 44 CSS pixels tall (minimum tap target).

## Components

### 1. `.status-badge` — purpose: instant "server is up" signal
Anatomy: pill container › dot (`::before`) › text `OK`.
Markup: `<p class="status-badge">OK</p>`.

- Container: `display: inline-flex; align-items: center; gap: var(--space-sm)`;
  `background: var(--color-ok-bg)`; `color: var(--color-ok-text)`;
  `font-size: var(--font-size-sm); font-weight: bold`;
  `padding: var(--space-sm) var(--space); border-radius: var(--radius)`.
- Dot (`.status-badge::before`): `content: ""; width: 0.6em; height: 0.6em;`
  `border-radius: var(--radius); background: var(--color-ok)`. CSS-only — never an
  image or emoji (self-contained constraint; A4 grep must stay at 0).
- The word `OK` is real text (screen-reader readable), never conveyed by color alone
  — the dot is redundant reinforcement (WCAG 1.4.1).

State table:

| State | Spec |
|---|---|
| Default | As above — always the "ok" appearance. If this page renders, the server is up (ux-architecture Flow 1); there is no reachable "down" variant, so do NOT ship red/amber styles. |
| Hover | No visual change — non-interactive (`cursor` stays default; no pointer). |
| Focus | Not focusable — non-interactive, never in tab order (no `tabindex`). Nothing to spec; only the footnote link receives focus. |
| Empty | Cannot be empty — text `OK` is a server-side string literal in the template, not data. |
| Error | N/A by design — no failing action exists; a server error means no page is served at all (browser-level error, outside this UI). |
| Disabled / Loading | N/A — no async work; page is fully server-rendered. |

### 2. `.status-uptime` — purpose: the one datum humans came for
Anatomy: row › label `Uptime` › value.
Markup: `<p class="status-uptime">Uptime <strong>3m 42s</strong></p>` (the literal
word `Uptime` satisfies AC3's case-insensitive grep).

- Container: `color: var(--color-muted); font-size: var(--font-size-sm)`; label and
  value stacked (`display: grid; gap: calc(var(--space-sm) / 2)`) so the large value
  reads as the page's focal point.
- Value (`.status-uptime strong`): `font-family: var(--font-mono);`
  `font-size: var(--font-size-lg); font-weight: bold; color: var(--color-fg)`.
- Value text formatted per ux-architecture "Uptime display rules" (largest-first
  units; `0s` when uptime rounds to zero).

State table:

| State | Spec |
|---|---|
| Default | Label in `--color-muted` + value in `--color-fg` as above, e.g. `3m 42s`. |
| Hover | No visual change — non-interactive. |
| Focus | Not focusable — non-interactive, never in tab order. |
| Empty | Must never render blank: uptime of zero whole seconds renders the literal `0s` (never an empty `<strong>`, never `-0s`). This is the just-restarted case from ux-architecture edge states; QA note A3 covers it. |
| Error | N/A — value is computed server-side from the same source as `/health`; if that computation could fail, the response itself fails and no partial page is shown. |
| Disabled / Loading | N/A — no async fetch; the value is baked into the HTML string. |

### 3. `.status-footnote` — purpose: route humans to the machine contract
Anatomy: line › anchor.
Markup: `<p class="status-footnote"><a href="/health">machine-readable: /health</a></p>`.

- Container: `font-size: var(--font-size-sm); color: var(--color-muted)`.
- Anchor styling comes entirely from the base link rules (no extra selectors needed).
- `href` must stay relative (`/health`) — an absolute URL breaks QA note A4.

State table:

| State | Spec |
|---|---|
| Default | Muted small line; underlined muted link. |
| Hover | Link text becomes `--color-fg` (base `a:hover`); underline persists. |
| Focus | `a:focus-visible` ring per base rules — `--focus-ring` outline, offset, pill radius. Never `outline: none`. |
| Empty | Cannot be empty — link text is a template string literal, not data. |
| Error | N/A — navigation to `/health` is the browser's concern; no in-page failure state exists. |
| Disabled / Loading | N/A — plain anchor, no async, never disabled. |

## Accessibility requirements (inline summary)
- All contrast pairs verified in design-tokens.md "Contrast summary" — every text
  pair ≥ 4.5:1, dot ≥ 3:1 on both its backgrounds.
- Focus: exactly one focusable element (the link); `--focus-ring` + offset on
  `:focus-visible`; never suppress the outline.
- Tap target: link hit area ≥ 44 CSS pixels tall via base link padding.
- Status is conveyed by text (`OK`, `Uptime 3m 42s`), color is reinforcement only.
- Language/structure: `<html lang="en">`, one `<h1>`, real text throughout.

## Builder mapping (spec section → acceptance criteria)
- Screen layout + `.status-uptime` markup → AC3 (200 + `text/html` + grep `uptime` ≥ 1).
- Style-block architecture + `.status-badge::before` dot + relative `/health` href →
  self-contained constraint and QA note A4 (grep for `<script|<link|<img|https?://` = 0).
- Nothing in this spec touches `/`, `/health` payload, or 404 → AC1/AC2/AC4 untouched.
- No new files: both markdown files here are design artifacts under `.agency/`, not
  shipped code → AC5 intact.

## Self-check record (ui-designer loop)
- (a) All 3 components have full state tables — default, hover, focus, empty, error
  rows filled (plus disabled/loading), no blank cells; N/A rows carry reasons. PASS.
- (b) Grep of this file for raw values (`#[0-9a-fA-F]{3,6}`, `\d+px`): 0 hits — all
  values are token references; raw values live only in design-tokens.md. PASS.
- (c) Token cross-check: every token referenced here (`--color-bg`, `--color-fg`,
  `--color-muted`, `--color-ok`, `--color-ok-text`, `--color-ok-bg`, `--font-sans`,
  `--font-mono`, `--font-size-sm`, `--font-size-lg`, `--space`, `--space-sm`,
  `--radius`, `--focus-ring`) exists in design-tokens.md; every token defined there
  is referenced here — no orphans in either direction. PASS.
