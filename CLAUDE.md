# Hitech lead scheduler

Internal booking app for Hitech Insurance Agency (Hebrew RTL, Next.js on Vercel). A coordination
team books meetings between leads and ~50 agents; n8n workflows sync everything to Surense (CRM),
the agents' Microsoft 365 calendars and Airtable. The current version schedules through Cal.com.
The project in progress replaces Cal.com with an in-house booking engine, an agent portal and a
staff portal.

## Read this first

**`.planning/README.md`** — the map of the project docs, then **`.planning/STATE.md`** — where
things stand right now and the next task. `STATE.md` is rewritten every session; durable facts live
in `PRODUCT.md`, `DECISIONS.md`, `ENGINEERING.md`, `SECURITY.md`. Read them before touching
anything. This file does not repeat them.

`.planning/` is local-only and gitignored. If it is missing, you are on a machine without the
project context — stop and say so.

## Session state — `.planning/STATE.md`

- **Read it first, every session.**
- **Update it at checkpoints, not only at the end**: after every commit/push/deploy/migration, when
  a task is finished or a new open item appears, and always right before handing back a review
  checklist or asking for a decision.
- Rewrite in place — replace stale lines, do not append a log. Move anything durable into the topic
  files. Never create a new dated handoff file.

## Hard rules

- **Never `git commit` / `git push` / deploy / `supabase db push` without explicit, per-action
  permission in that same message.** Approval of the work is not approval to ship it. Ask every
  time; permission never carries over.
- **`npm run build` is the gate.** Type-checking or reasoning is not verification.
- **No personal data or secrets in git, ever.** Synthetic test data only.
- **n8n is not touched until the n8n phase** — see `.planning/DECISIONS.md` #16. All outbound
  integration goes through `lib/integrations/n8n/` behind its interface.
- **Authorize on the server on every route; RLS on every table.** `.planning/SECURITY.md` is
  binding.
- Code and tests never read from `.planning/`.

## Reporting back

- Brief, straight to the point. Lead with the result.
- Every round of work ends with a short review checklist that shrinks each round; every line says
  where to click and as which account; say which items are judgement calls.
- Never start a line, bullet or table cell with Hebrew — the terminal flips it.
