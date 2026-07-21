---
description: Scaffold a new agency agent file from the house template, in the right department
---

Scaffold a new agent for this role: **$ARGUMENTS**

1. If `$ARGUMENTS` is empty or too vague to derive a specialty and a verifiable self-check, ask the human: what the agent does, what "verified done" looks like for its output, and which department it belongs to. Don't scaffold a vague agent.
2. Pick the department folder under `.claude/agents/` (engineering | design | marketing | product | project-management | testing | operations | specialized | spatial). Create the folder if new (e.g. `spatial/` for XR roles). Derive a kebab-case `name` that doesn't collide with an existing agent (`grep -r "^name:" .claude/agents/`).
3. Write the file following the house template EXACTLY (see CLAUDE.md § House agent template — copy the structure from any existing agent, e.g. `.claude/agents/engineering/rapid-prototyper.md`):
   - `description:` must be delegation-friendly: one sentence of expertise + "Use PROACTIVELY when <trigger>. MUST BE USED for <situations>."
   - `tools:` least privilege — analysts/reviewers: `Read, Grep, Glob` (+ `Bash` only if they run tests/scanners; + `Write, Edit` restricted in-prompt to `.agency/` files if they write reports/handoffs); builders: `Read, Write, Edit, Bash, Glob, Grep`; content/marketing: never `Bash`.
   - `model:` haiku for high-volume/simple output, sonnet default, opus only for judgment-critical gates/architecture.
   - All six body sections (Inputs you expect / How you work / Self-check loop / Output contract / Handoff / Escalation) with role-specific, concrete content. The self-check must be something the agent can actually execute, not "review your work". No placeholder text. Under ~150 lines.
4. Gate check: agents whose verdicts gate the pipeline must write PASS/FAIL + evidence to `review.md` and may never PASS without evidence — bake that into the prompt if this is a gate role.
5. Print the new file path and its frontmatter, and remind the human that new agents are picked up in the next session (or after a reload).
