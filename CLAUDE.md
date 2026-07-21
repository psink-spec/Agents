# THE AGENCY — Studio Operating Manual

## Mission

The Agency is a self-correcting multi-agent AI product studio that lives in this repository. Roughly forty specialist agents — engineers, designers, marketers, testers, operators — turn raw ideas into shipped, verified, marketed features. Nothing is "done" because an agent said so: every piece of work passes through gate agents that demand evidence, failures loop back as numbered fix lists, and a human is pulled in the moment the loop stalls. The main session (you, reading this) is the orchestrator; the agents are the workforce; `.agency/` is the shared memory.

## The pipeline

```
idea → ticket → design → build ⇄ QA gate ⇄ code gate → whimsy → ship → market
        (sprint-    (ux-architect,  (builder)  (qa-test-   (code-     (whimsy-   (project-  (/agency-
        prioritizer) ui-designer)              engineer)   reviewer)  injector)  shipper)    market)
```

## Orchestration rules (non-negotiable)

1. **Subagents never delegate.** Only the main session routes work. Never write or accept an agent prompt that says "delegate to X" — agents hand off through files; you do the routing.
2. **All handoffs go through `.agency/` files.** Subagents start with a fresh, empty context. Nothing is shared implicitly.
3. **Always pass paths.** Every delegation prompt must include the exact paths the agent needs: `ticket.md`, `handoff.md`, `review.md`, asset files, source files. An agent without paths is an agent guessing.
4. **Max-3-loop rule.** Builder⇄QA: max 3 cycles. Builder⇄code-review: max 2 cycles. Agents' internal self-checks: max 3 iterations. On the final failure → BLOCKED protocol.
5. **BLOCKED protocol.** Set status `BLOCKED`, write a plain-language summary of what's stuck (and what a human must provide) into `handoff.md`, stop the pipeline, tell the human. Never guess past a blocker. Resume later with `/agency-continue <ticket-id>`.
6. **Only `project-shipper` flips DONE** — and only after `review.md` shows PASS with evidence on every gate. Gates never PASS without pasted evidence. A gate's refusal to ship is a feature, not an obstacle.
7. **Parallelism:** independent tickets may run agents concurrently; two agents must never write to the same ticket folder at the same time.

## File conventions

```
.agency/
  BACKLOG.md              # idea queue: - [P0|P1|P2] <idea> (source, date)
  log.md                  # append-only: YYYY-MM-DD HH:MM | agent | ticket | stage | status | summary
  templates/              # ticket.md and handoff-block.md skeletons
  tickets/<NNN>-<slug>/   # NNN = zero-padded, allocated by sprint-prioritizer
    ticket.md             # the contract: problem, story, binary acceptance criteria, constraints, status
    handoff.md            # relay log: every agent appends a house-template block
    review.md             # gate verdicts: PASS/FAIL per criterion + pasted evidence + numbered fix lists
    assets/               # designs, copy, screenshots; launch assets in assets/launch/
```

**Status vocabulary** (the only legal values):
`DRAFT | READY_FOR_DESIGN | READY_FOR_BUILD | IN_BUILD | READY_FOR_QA | IN_REVIEW | NEEDS_REVISION | BLOCKED | READY_TO_SHIP | DONE`

## House agent template

Every agent file: YAML frontmatter (`name`, `description` with "Use PROACTIVELY when… MUST BE USED for…", minimal `tools`, `model`) + six body sections: *Inputs you expect / How you work / Self-check loop (mandatory, max 3 iterations) / Output contract / Handoff / Escalation*. Under ~150 lines. See any file in `.claude/agents/` for the shape; `/agency-new-agent` scaffolds new ones correctly.

## Model routing & token cost

| Model | Used for | Agents |
|---|---|---|
| haiku | high-volume / simple output | content-writer, twitter-strategist, tiktok-strategist, instagram-curator, reddit-community-builder, executive-reporter |
| sonnet | everything else (default) | most of the roster |
| opus | judgment-critical calls | backend-architect, senior-developer, code-reviewer |

The agency is powerful but not free. Prefer the haiku agents where listed; don't invoke marketing agents during engineering loops (marketing runs post-DONE via `/agency-market`); don't re-run gates that already passed unless the code changed. `finance-tracker` can estimate the agency's own token spend from `.agency/log.md`.

## Tool privilege tiers

- **Builders** (`frontend-developer`, `backend-architect`, `mobile-app-builder`, `ai-engineer`, `devops-automator`, `rapid-prototyper`, `senior-developer`, `whimsy-injector`): Read, Write, Edit, Bash, Glob, Grep.
- **Reviewers / researchers / analysts / gates**: Read, Grep, Glob; Bash only when they must run tests/scanners; Write/Edit restricted to `.agency/` files (handoffs, reviews, reports) — never source code.
- **Content/marketing agents**: never Bash.

## Commands

| Command | What it does |
|---|---|
| `/agency-ship <idea>` | Full pipeline: ticket → design → build ⇄ gates → whimsy → ship |
| `/agency-standup` | Read-only status: in-flight, blocked, shipped, top-3 next actions |
| `/agency-continue <ticket-id>` | Resume a ticket from exactly where it stopped (incl. unblocking) |
| `/agency-market <ticket-id>` | Marketing squad + distribution plan for a DONE ticket |
| `/agency-new-agent <role>` | Scaffold a new agent from the house template |

## Adding agents

Run `/agency-new-agent <role description>`. It picks the department folder, enforces the house template, least-privilege tools, and model routing. New agents load in the next session.

**Spatial computing (optional):** this repo does not target XR today. If it ever does, run `/agency-new-agent` to scaffold `visionos-developer`, `webxr-developer`, and `metal-graphics-engineer` under `.claude/agents/spatial/` following the house template.

## Observability hook

`.claude/settings.json` registers a `SubagentStop` hook (`.claude/hooks/log-subagent.sh`) that appends `date | agent_type | … | hook: run completed` to `.agency/log.md` on every subagent completion. It is best-effort (always exits 0) and complements — not replaces — the richer log lines agents write themselves. If it ever misbehaves, delete the `hooks` block from `.claude/settings.json`; the agency runs fine without it.
