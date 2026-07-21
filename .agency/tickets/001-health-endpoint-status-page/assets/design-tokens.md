# Design Tokens — Ticket 001: `/status` page

Scope: these tokens exist ONLY as CSS custom properties on `:root` inside the single
inline `<style>` block of the `/status` HTML template (per ux-architecture.md — no
external stylesheet, no tokens file is shipped). This markdown file is the source of
truth for names/values; the builder transcribes the `:root` block verbatim.

No prior design-tokens.md exists in any ticket and the codebase has no token
definitions (verified by glob/grep) — this is a fresh, ticket-local set. Names
`--color-bg`, `--color-fg`, `--color-ok`, `--color-muted`, `--space`, `--radius`
are kept exactly as proposed in ux-architecture.md; the rest extend that set.

## Color

| Token | Value | Usage rule |
|---|---|---|
| `--color-bg` | `#ffffff` | Page background. Only background of `body`. |
| `--color-fg` | `#1a1a1a` | Default text color; also the focus-ring color. 16.7:1 on `--color-bg` (AAA). |
| `--color-muted` | `#6b7280` | Secondary text only: uptime label, footnote line. 4.83:1 on `--color-bg` (AA normal text) — never use at sizes below `--font-size-sm`. |
| `--color-ok` | `#16a34a` | Badge dot fill ONLY — never for text. 3.30:1 on `--color-bg` and 3.15:1 on `--color-ok-bg` (≥3:1, WCAG 1.4.11 non-text). |
| `--color-ok-text` | `#15803d` | The word `OK` inside the badge. 5.02:1 on `--color-ok-bg` and on `--color-bg` (AA normal text). Never use for the dot (keep dot/text roles distinct). |
| `--color-ok-bg` | `#f0fdf4` | Badge pill background tint. Decorative; anything on it must pass contrast against it, not against `--color-bg`. |

## Type

| Token | Value | Usage rule |
|---|---|---|
| `--font-sans` | `system-ui, sans-serif` | Everything except the uptime value. No webfonts ever (ticket constraint). |
| `--font-mono` | `ui-monospace, monospace` | Uptime value only (tabular feel across refreshes). |
| `--font-size-sm` | `0.875rem` | Badge text and footnote. Smallest size on the page — nothing smaller. |
| `--font-size-lg` | `2rem` | Uptime value only. One large number per page. |

Base body text uses the browser default size (1rem) — intentionally no token, so the
scale stays three steps: default, `sm`, `lg`.

## Spacing

| Token | Value | Usage rule |
|---|---|---|
| `--space` | `1rem` | Block rhythm: body padding, vertical gap between the three components. |
| `--space-sm` | `0.5rem` | Intra-component gaps: dot-to-text gap, badge horizontal padding, label-to-value gap. |

No other spacing values allowed; use `calc()` on these two if a variant is truly needed.

## Radius

| Token | Value | Usage rule |
|---|---|---|
| `--radius` | `999px` | Pill/circle shape: badge pill and its dot. The only radius on the page. |

## Focus

| Token | Value | Usage rule |
|---|---|---|
| `--focus-ring` | `2px solid var(--color-fg)` | `outline` value for `:focus-visible` on any interactive element (this page has exactly one: the `/health` link). Always paired with `outline-offset: var(--space-sm)` divided by 4 — see ui-spec; never remove an outline without replacing it. |

## Elevation

None defined. The page is a single flat document with no layered surfaces — a shadow
token would be unused. Add only if a future ticket introduces overlapping surfaces.

## Motion

None defined. No animated or transitioning state exists (no auto-refresh, no async,
link hover is an instant color change). Do not add `transition` declarations without
adding a motion token first.

## Contrast summary (all pairs used)

| Foreground | Background | Ratio | Requirement | Result |
|---|---|---|---|---|
| `--color-fg` | `--color-bg` | 16.7:1 | 4.5:1 (AA text) | PASS |
| `--color-muted` | `--color-bg` | 4.83:1 | 4.5:1 (AA text) | PASS |
| `--color-ok-text` | `--color-ok-bg` | 4.79:1 | 4.5:1 (AA text) | PASS |
| `--color-ok-text` | `--color-bg` | 5.02:1 | 4.5:1 (AA text) | PASS |
| `--color-ok` (dot) | `--color-ok-bg` | 3.15:1 | 3:1 (non-text) | PASS |
| `--color-ok` (dot) | `--color-bg` | 3.30:1 | 3:1 (non-text) | PASS |
