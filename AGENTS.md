<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# GRAFITE (study e-commerce)

A study project: Gustavo learns by reviewing finished, commented code. Talk to him in pt-BR; code, identifiers and the glossary are in English. Roadmap: `.scratch/roadmap.md`.

## Learning workflow

Gustavo's priority is **finishing this project**: he struggles with procrastination and has
abandoned past projects mid-way, so momentum beats exercises. Since 2026-10-01:

- **Claude writes all the code**, every ticket (UI and non-UI). Tickets are written with
  `Responsável: Claude`; no `## Guia` exercise sections.
- **One ticket at a time.** At the end of each ticket, stop and hand off to Gustavo in pt-BR:
  - a short summary of what was done and the decisions and why (security measures
    explained by the attack they prevent);
  - the **files to review, in reading order**.
  Wait for him before starting the next ticket.
- Record each ticket's decisions in its `## Comments`: they are the raw material for the
  study doc.
- Code keeps short explanatory comments in pt-BR that explain *why*, not *what*.
- **At the end of each feature**, write the feature study doc in the format of the
  Foundation one (`~/Documentos/grafite-estudo/`: a README + one chapter per topic; each
  chapter = concept from scratch → how GRAFITE does it → pitfalls). Gustavo will later
  rebuild each feature as an isolated study project (one per module: foundation, auth, ...),
  so the doc must stand on its own as a guide for that.
- Add missing security measures proactively.

## Resuming work

Sessions end and context gets compacted; the files are the memory. When starting or resuming:

1. Read `.scratch/roadmap.md` to find the current feature.
2. Read that feature's `spec.md` and the `Status:` of its tickets in `issues/`.
3. Check `git log --oneline` (one commit per ticket) to confirm what is done.

Ticket status flow: `open` → `claimed` (work started) → `resolved`. Update the `Status:` line and the roadmap as work moves. Prefer starting a fresh session per feature.

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
