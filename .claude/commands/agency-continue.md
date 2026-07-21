---
description: Resume the agency pipeline for a ticket from exactly where it stopped
---

Resume the pipeline for ticket: **$ARGUMENTS**

1. Locate the ticket folder: `.agency/tickets/$ARGUMENTS*/` (accept a bare number like `003` or a full `003-slug`). If nothing matches, list existing ticket folders and stop.
2. Read that ticket's `ticket.md` (status + acceptance criteria), the FULL `handoff.md` (who did what, what the last block says the next agent needs), and `review.md` if present. This is the complete state — trust the files, not memory.
3. Map status → resume point, then continue the `/agency-ship` pipeline (`.claude/commands/agency-ship.md`) from exactly that stage, with all its hard rules (gates, loop caps, BLOCKED protocol, explicit paths in every delegation):

| Status | Resume at |
|---|---|
| DRAFT | Re-run `sprint-prioritizer` to finish the ticket |
| READY_FOR_DESIGN | Stage 2: `ux-architect` → `ui-designer` |
| READY_FOR_BUILD | Stage 3: route the builder |
| IN_BUILD | Re-delegate the same builder named in the last handoff block, telling it to finish |
| READY_FOR_QA | Stage 5: `qa-test-engineer` |
| NEEDS_REVISION | Send the newest numbered fix list from review.md back to the builder, then re-gate. Count previous cycles from review.md/handoff.md so the max-3 (QA) / max-2 (code review) caps include past attempts |
| IN_REVIEW | Stage 6: `code-reviewer` |
| READY_TO_SHIP | Stage 8: `project-shipper` |
| BLOCKED | See below |
| DONE | Nothing to resume — suggest `/agency-market $ARGUMENTS` instead |

4. **BLOCKED tickets:** state the recorded blocker to the human. If the human's invocation of this command already supplied what was missing (credentials, a decision, clarified requirements), append a `human — unblock` block to handoff.md recording the answer, set status back to the stage that blocked, and resume. If the blocker is still unresolved, ask the human for exactly what's missing and stop.
5. On completion, report the same way `/agency-ship` does, and make sure `.agency/log.md` got a line per agent run.
