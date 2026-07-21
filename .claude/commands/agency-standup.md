---
description: Read-only studio standup — in-flight tickets, blockers, recent ships, top-3 next actions
---

Run a read-only standup for The Agency. Change NOTHING — no file writes, no status changes, no delegations.

1. Read every `.agency/tickets/*/ticket.md` and extract: ticket id, title, current status. For anything in-flight, read the last handoff block of that ticket's `handoff.md` to know who touched it last and what's next.
2. Read `.agency/log.md` (tail is fine) to see recent activity and what shipped since the last standup entry.
3. Read `.agency/BACKLOG.md` for queued ideas.

Print exactly four sections:

**In flight** — one line per non-terminal ticket: `<NNN>-<slug> | <STATUS> | last: <agent> | next: <what the handoff says>`

**Blocked** — every BLOCKED ticket with (a) the plain-language reason from its handoff.md and (b) the specific human action needed to unblock (then suggest `/agency-continue <ticket-id>`).

**Shipped since last standup** — DONE tickets with their one-line ship summaries from review.md.

**Top 3 recommended next actions** — concrete, e.g. "unblock 003 by providing the API key", "run /agency-ship on the top P0 backlog item", "run /agency-market 002 — it shipped but was never marketed". Base these only on what the files say.

If `.agency/` has no tickets yet, say so and suggest `/agency-ship <idea>` to start.
