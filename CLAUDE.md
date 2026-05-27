# Calcey Hours — Claude Code Instructions

## Project overview

Internal SPA for Calcey Technologies employees to log time against projects and tasks. Managers review, approve, and amend entries. Three primary jobs: **log time fast**, **see the week at a glance**, **manager approval queue**.

Full context lives in memory and in `docs/`. MUST Always check these before making decisions:
- `docs/dev_plan.md` — authoritative staged build plan (Stages 0–9, gates, RLS policies)
- `docs/decisions.md` — every architectural decision with rationale
- `docs/progress.md` — per-stage gate checklist

## IMPORTANT: always update the docs

**After completing any stage work — or any decision that has lasting architectural impact — update these two files before finishing:**

- `docs/decisions.md` — add a new `### D<stage>-NN · <title>` entry explaining what was decided and why
- `docs/progress.md` — tick off gate items as they pass (✅), mark in-progress stages as 🔄, and expand stages with their detailed checklists when you begin them

Do this even for small decisions (e.g. "chose X over Y because..."). The decisions log is the team's shared memory across sessions.

## Design system

The design files must be used ONLY for the design system and layout inspiration. The dev_plan ALWAYS takes priority in case of ambiguity.

Tokens live in `design_handoff_calcey_hours/design/design_system/colors_and_type.css` and are mapped into Tailwind via `@theme` in `src/index.css`. Use the token names directly:

```
bg-tropical-magenta   text-ink-1000   border-ink-200   shadow-brand
bg-ink-50             text-ink-600    rounded-2xl      shadow-md
```

Fonts: **Red Hat Display** (local variable font in `public/fonts/`) for all text; **Red Hat Mono** (Google Fonts) for overlines, metadata, tabular numbers.

Full design spec: `design_handoff_calcey_hours/README.md`
