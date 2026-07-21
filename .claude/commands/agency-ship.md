---
description: Run the full agency pipeline on an idea — ticket → design → build ⇄ QA ⇄ code review → whimsy → ship
---

Run The Agency's flagship pipeline on this idea: **$ARGUMENTS**

You are the orchestrator (main session). Subagents cannot spawn subagents — you do ALL routing. Every delegation prompt MUST include explicit absolute-or-repo-relative file paths: the ticket's `ticket.md`, `handoff.md`, `review.md`, relevant `assets/` files, and relevant source files. Subagents start with empty context; they know only what you pass them.

## Hard rules (non-negotiable)
- Never skip a gate. Never mark DONE yourself — only `project-shipper` sets DONE, and only after gates PASS with evidence in `review.md`.
- Max loop counts are hard stops: 3 builder⇄QA cycles, 2 builder⇄code-review cycles. On the final failure: set status `BLOCKED`, write a plain-language summary of what's stuck into `handoff.md`, STOP, and tell the human.
- Independent tickets may run subagents in parallel/background, but NEVER run two agents that write to the same ticket folder concurrently.
- After every stage, confirm the agent appended its handoff block and set a valid status. If it didn't, that's a failed handoff — re-delegate with a correction, don't patch it silently.

## Pipeline

### 1. Intake
Delegate to `sprint-prioritizer` with the idea verbatim. It creates `.agency/tickets/<NNN>-<slug>/` (ticket.md with binary, testable acceptance criteria + empty handoff.md, review.md, assets/).
- If it rejects the idea as too vague: print its 3 clarifying questions to the human and STOP. Do not guess answers.
- Read the resulting ticket.md yourself before proceeding — you need the criteria and constraints to route.

### 2. Design (skip for pure-backend tickets)
If the ticket has any UI/UX surface (status READY_FOR_DESIGN): delegate to `ux-architect`, then `ui-designer` (sequential — same ticket folder). Their specs land in `assets/` and handoff.md. Pure-backend tickets (READY_FOR_BUILD) skip straight to step 3.

### 3. Route the build
Pick builder(s) by stack:
- `frontend-developer` — web UI work
- `backend-architect` — APIs, schema, services
- `mobile-app-builder` — iOS/Android/RN/Flutter
- `rapid-prototyper` — POCs, MVPs, "just make it work" tickets
- `senior-developer` — gnarly refactors, cross-cutting or high-risk changes
The delegation prompt MUST include: ticket.md path, handoff.md path, design asset paths (if any), and the acceptance criteria pasted verbatim.

### 4. LOOP A — build self-check
The builder runs its own internal self-check loop (max 3 internal iterations) before handing off with status READY_FOR_QA. You don't manage this loop; you verify the handoff block reports what was checked.

### 5. LOOP B — QA gate (max 3 cycles)
Delegate to `qa-test-engineer` with ticket.md, handoff.md, review.md paths and where the code lives. It executes the product and writes review.md: PASS/FAIL per criterion with pasted evidence.
- Any FAIL → send its numbered fix list back to the SAME builder (paste the list verbatim, plus paths) → re-delegate `qa-test-engineer`.
- Count cycles. After the 3rd failed cycle: status `BLOCKED`, plain-language stuck-summary, STOP, tell the human.

### 6. LOOP C — code review gate (max 2 cycles)
Delegate to `code-reviewer` (paths + list of files changed, from handoff.md). Blockers → fix list back to the builder → re-review (max 2 cycles, then BLOCKED protocol). Majors: fix if cheap, otherwise log to `.agency/BACKLOG.md` with the ticket reference. Minors → append to `.agency/BACKLOG.md` as follow-ups.

### 7. Delight pass (UI tickets only)
Delegate to `whimsy-injector`. Then re-run `qa-test-engineer` ONCE to confirm nothing broke. If that re-check fails, revert the whimsy changes (git) rather than looping.

### 8. Ship gate
Delegate to `project-shipper` with ticket.md, handoff.md, review.md paths. It verifies PASS evidence, updates CHANGELOG.md/docs, writes the ship summary, sets DONE. If it refuses: that refusal is correct — route its numbered gaps back to the right stage or BLOCK.

### 9. Report to the human
Print: what shipped, evidence summary (which criteria passed and how), anything blocked, and 2–3 suggested next backlog items (append them to `.agency/BACKLOG.md`). Confirm `.agency/log.md` has one line per agent run this pipeline; append any missing lines.
