<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# GRAFITE (study e-commerce)

A study project: the goal is for the human (Gustavo) to learn, not just to ship. Talk to him in pt-BR; code, identifiers and the glossary are in English. Roadmap: `.scratch/roadmap.md`.

## Learning workflow

Every ticket has a `Responsável:` line set in the spec: `Claude` or `Gustavo`.

- **UI is always Claude's**: pages, layouts, components and styling. Gustavo found UI exercises too abstract without a visual reference, so never assign him UI tickets.
- **Gustavo takes non-UI work**: server actions, queries, Zod schemas, domain rules, tests, config and infrastructure (Supabase, Vercel).
- **Claude tickets** are worked examples: all UI, plus the first occurrence of each new non-UI pattern (and first-time security-critical code such as auth config or the Checkout stock transaction). Implement them fully, with short explanatory comments in pt-BR that explain *why*, not *what*.
- **Gustavo tickets** are exercises: the next occurrence of a non-UI pattern already shown. Never implement them. The ticket carries a `## Guia` section with steps, hints, pitfalls and a pointer to the worked example, but not the solution. When he's stuck, give hints before code.
- **Review**: when Gustavo finishes a ticket, review his code against the spec (bugs, security, practices) and explain what you would change and why.
- **Fading**: in later features Gustavo takes more tickets, including new patterns with only a guide.
- Explain security measures by the attack they prevent, and add missing ones proactively.

## Resuming work

Sessions end and context gets compacted; the files are the memory. When starting or resuming:

1. Read `.scratch/roadmap.md` to find the current feature.
2. Read that feature's `spec.md` and the `Status:` of its tickets in `issues/`.
3. Check `git log --oneline` (one commit per ticket) to confirm what is done.

Ticket status flow: `open` → `claimed` (work started) → `in-review` (Gustavo finished, waiting for review) → `resolved`. Update the `Status:` line and the roadmap as work moves. Prefer starting a fresh session per feature.

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
