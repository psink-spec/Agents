# Whimsy pass — Ticket 001 `/status` page

## Result: no delight shipped — reverted, status BLOCKED

`smoke-test/server.js` is byte-for-byte identical to the QA-passed/code-reviewed
baseline (`git diff smoke-test/server.js` is empty). No product file was changed
in the end. This file documents what was tried, the measured numbers, and why it
was cut, per the self-check loop's "revert and report honestly" rule.

## Baseline (measured before any edit)

- No test runner, lint tool, or accessibility checker exists anywhere in the repo
  (confirmed: no `package.json`/CI config anywhere; `grep -riE "axe|pa11y|lighthouse"`
  across the repo returns nothing). This is expected and by design — AC5 requires
  `smoke-test/` to stay dependency-free, and code-reviewer's block already recorded
  `node --check` + the AC curl gates as the accepted lint/test evidence for this repo.
- `smoke-test/server.js`: 3749 bytes / 80 lines.
- `GET /status` response body: 1855 bytes.
- AC1–AC5 all PASS (re-verified live against a fresh `node smoke-test/server.js`
  before touching anything — see commands below, all matched review.md).

## Candidate addition (what I tried)

One tasteful, restrained touch: a one-time "success" entrance animation on
`.status-badge` (the `OK` pill) — a `.2s` opacity fade-in on page load, reinforcing
the "server is up" confirmation moment. Chose this over a second candidate (a
transform-only hover nudge on the `/health` footnote link) specifically because
design-tokens.md documents a deliberate, reasoned "no motion" starting point
("no animated or transitioning state exists... link hover is an instant color
change") and its own forward-guidance ("do not add transition declarations without
adding a motion token first") — I read that as permission to add *one* new,
`prefers-reduced-motion`-guarded motion primitive if genuinely worthwhile, not a
blanket license to animate every interactive element on a page whose design was
explicitly reviewed and shipped flat. I dropped the link-hover touch immediately
(iteration 1) to stay inside that spirit and to protect the size budget.

Implementation used only `transform`/`opacity`-safe properties (opacity only, in
the end), a `.2s` duration (inside the 150–300ms band), and was wrapped in a
`@media (prefers-reduced-motion: reduce) { .status-badge { animation: none } }`
guard that fully disables it — verified 1:1 via
`grep -n "animation:"` / `grep -n "prefers-reduced-motion"` (one `animation:`
declaration, one matching guard, every time).

## Three trim iterations (self-check loop)

| Iteration | Addition | server.js size | Δ vs 3749 baseline | `/status` body size | Δ vs 1855 baseline |
|---|---|---|---|---|---|
| 1 | Badge fade+scale-in (`--motion-ease` token, keyframes, guard) **plus** link hover `transform: translateY(-1px)` (separate token use, extra guard clause) | 4079 B | +330 B (+8.8%) | 2185 B | +330 B (+17.8%) |
| 2 | Dropped the link-hover touch entirely; kept badge animation but simplified to a bare opacity keyframe, no custom token | 3900 B | +151 B (+4.0%) | 2006 B | +151 B (+8.1%) |
| 3 | Tightened further: single-value `from{opacity:0}` keyframe (browser fills the implicit `to` from computed style), minimal media-query, then a same-size clarity rename (`f` → `fade`) for maintainability | 3870 B | +121 B (+3.2%) | 1976 B | +121 B (+6.5%) |

All three iterations passed AC1–AC5, the self-contained grep (`<script|<link|<img|https?://` = 0), and `node --check` at every step — the only failing self-check item across all three iterations was (b), the 2% size-increase budget.

## Why iteration 3 still can't clear the budget (the math)

2% of the 3749-byte baseline is ~75 bytes. The mandatory accessibility guard alone —
`@media(prefers-reduced-motion:reduce){.status-badge{animation:none}}` — is 70
bytes by itself, before a single byte of the actual `@keyframes` rule or the
`animation:` declaration that triggers it. There is no way to shrink a real CSS
media-feature name (`prefers-reduced-motion`) or add a working keyframe animation
under a ~75-byte ceiling; the guard is non-negotiable per the whimsy-injector's own
rules ("every animation wrapped in a `prefers-reduced-motion: reduce` guard"). This
is a case where the generic "under 2% of baseline" bundle-size heuristic (written
for real bundles measured in tens/hundreds of KB) doesn't scale down to a
hand-written, ~1.8–3.7KB single-file artifact with no build step — any minimum
viable, correctly-guarded animation will exceed it by construction.

For context on real-world impact: the reverted candidate's overhead (121 bytes)
is a single TCP packet fragment, transferred once per page load with no extra
network request, no client JS, no layout shift, and negligible-to-nothing after
gzip (the repo's HTTP server does not currently send `Content-Encoding` at all, so
this number is uncompressed worst case). In absolute terms the cost is trivial —
but it is not *provably* under the literal 2% rule, and per the self-check loop's
explicit instruction ("Max 3 internal iterations. If still failing, revert the
offending addition and report honestly what was cut and why"), I revert rather
than ship an unverified exception to my own budget gate.

## What was cut and why

- Cut: badge fade-in entrance animation (all 3 iterations). Reason: could not get
  the `/status` HTML/`server.js` size increase under the 2% self-check threshold
  after 3 trim iterations — the mandatory `prefers-reduced-motion` guard alone
  exceeds the entire byte budget available on this small file.
- Cut (earlier, iteration 1): link hover `transform: translateY(-1px)` nudge.
  Reason: same size budget, plus more conservative respect for the design-tokens'
  documented "no motion" rationale — dropped first since it was the less essential
  of the two candidates.
- Not attempted: any non-motion delight (copy changes, icons/emoji, box-shadow/
  elevation) — ruled out up front because they either change copy meaning (banned
  by my brief), require an elevation token the design docs explicitly declined to
  define ("Elevation: None defined... add only if a future ticket introduces
  overlapping surfaces"), or require an external asset/image (banned by the
  self-contained constraint, QA note A4).

## Recommendation

This ticket's `/status` page (a flat, ~1.8KB, deliberately motion-free smoke-test
admin surface) has essentially no headroom for whimsy under a literal 2%
size-increase gate — any addition big enough to be visible on the page will also
be big enough to blow the budget on a file this small. If delight is wanted here in
the future, either (a) accept a documented, human-approved exception to the 2%
rule for artifacts under some size floor (e.g. <10KB), or (b) scope it as part of a
future ticket that also revisits the "no motion" design decision with ui-designer/
ux-architect sign-off rather than as an unreviewed whimsy-pass add-on.

## Self-check summary (final state = baseline, unchanged)

- (a) tests/lint: `node --check smoke-test/server.js` → `syntax OK`, matches
  baseline exactly (no test/lint framework exists in this repo).
- (b) size: 0% — no product file changed (reverted).
- (c) a11y: no checker exists in repo; N/A, trivially zero new violations since
  nothing shipped.
- (d) motion guard grep: N/A — no animation code shipped, so no guard needed.
- AC1–AC5 re-verified live one final time post-revert: all PASS, `smoke-test/`
  contains only `README.md` and `server.js`, server stopped cleanly each run.
