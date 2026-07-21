---
description: Run the marketing squad on a DONE ticket — launch assets + distribution checklist
---

Run the marketing squad for ticket: **$ARGUMENTS**

1. Locate `.agency/tickets/$ARGUMENTS*/` and read `ticket.md` + `review.md`. **Precondition:** status must be DONE. If not, stop and say the ticket must ship first (`/agency-continue $ARGUMENTS`). Marketing runs only on shipped, evidence-backed work — that's what keeps the copy honest.
2. Create `assets/launch/` inside the ticket folder.
3. Delegate the squad **in parallel** (they write different files in `assets/launch/`, so parallel is safe). Every prompt includes the paths to `ticket.md`, `review.md`, `handoff.md`, and the `assets/launch/` output folder, plus this rule verbatim: "Claims may only come from ticket.md facts and shipped behavior evidenced in review.md."
   - `content-writer` → `assets/launch/blog.md`
   - `twitter-strategist` → `assets/launch/twitter.md`
   - `tiktok-strategist` → `assets/launch/tiktok.md`
   - `instagram-curator` → `assets/launch/instagram.md`
   - `reddit-community-builder` → `assets/launch/reddit.md`
   - `app-store-optimizer` → `assets/launch/aso.md` — ONLY if the ticket is a mobile app
   - Optionally `growth-hacker` → `assets/launch/growth-experiments.md` if the ticket is a user-facing feature with a measurable funnel
4. Wait for all squad members to finish, then delegate `distribution-strategist` with paths to everything in `assets/launch/` → it writes `assets/launch/launch-checklist.md` (per-channel checklist with timing and owner).
5. Spot-check one asset: pick any factual claim and verify it traces to ticket.md or review.md. If a fabricated claim slipped through, send that file back to its author with the specific claim quoted (one redo round max, then flag to the human).
6. Report: list the assets created, the launch checklist highlights, and log one line per agent to `.agency/log.md`.
