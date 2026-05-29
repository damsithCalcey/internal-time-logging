# Calcey Hours

Internal SPA for Calcey Technologies employees to log time against projects and tasks; managers review, approve, and amend entries.

## Setup

### Prerequisites

- Node.js **≥ 22**
- pnpm **≥ 9** (pinned to `9.15.0` via `packageManager`)
- A [Supabase](https://supabase.com) project (Postgres + Auth) for anything beyond a static build

### Install

```bash
pnpm install
```

### Environment

Copy the example env files and fill in your Supabase project values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

- [apps/api/.env.example](apps/api/.env.example) — `SUPABASE_URL`, `SUPABASE_JWT_ISSUER`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `PORT`, `CORS_ORIGIN`
- [apps/web/.env.example](apps/web/.env.example) — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

### Database

The first migration also wires the Supabase Auth Hook (`custom_access_token_hook`) and the `supabase_auth_admin` grants it needs — see [docs/dev_plan.md](docs/dev_plan.md) §1.4 before pointing this at any non-local database.

```bash
pnpm db:push       # apply Drizzle schema to the dev DB
pnpm db:generate   # generate a new migration after schema changes
pnpm db:migrate    # run pending migrations
pnpm --filter api db:seed   # seed dev data
```

### Run

```bash
pnpm dev           # turbo runs web + api in parallel
```

- Web: http://localhost:5173
- API: http://localhost:3001 (`GET /health → { ok: true }`)

### Other commands

```bash
pnpm build         # build all packages
pnpm typecheck     # tsc --noEmit across the workspace
pnpm lint          # eslint across the workspace
pnpm test          # vitest across the workspace
```

Filter to a single app with `pnpm --filter web <script>` or `pnpm --filter api <script>`.

## Architecture

pnpm monorepo orchestrated by Turborepo. Frontend is a React SPA; the Hono BFF is the only path to data.

```
apps/
  web/    React 19 + Vite + TanStack Query + React Hook Form + Tailwind
  api/    Hono on Node + Drizzle ORM + postgres (porsager) + jose JWT verify
packages/
  shared-types/   Zod schemas / DTOs / enums shared by web and api
  tsconfig/       shared tsconfig presets
  eslint-config/  shared eslint preset (incl. cross-slice import rules)
```

### Request flow

1. The browser authenticates **directly with Supabase Auth** (`@supabase/supabase-js`) and stores the JWT.
2. Every data call goes to the BFF with `Authorization: Bearer <jwt>`.
3. BFF middleware verifies the JWT against Supabase JWKS using `jose`, then loads `role` + `is_active` from claims injected by the `custom_access_token_hook`.
4. BFF talks to Postgres via Drizzle. Supabase `authenticated` / `anon` roles have **no** table grants — RLS is `deny-all` as belt-and-braces.

### Vertical slices

Each domain (`auth`, `projects`, `tasks`, `time-entries`, `approvals`, `daily-log`, `weekly-summary`, `timer`, `admin-users`) is a slice on both sides of the wire:

- **api slice** — `routes/*.ts` (Hono handlers + Zod validation) → `useCases/*/commands.ts` (writes: cross-row authz, orchestration, transactions) + `useCases/*/queries.ts` (reads) → entities under [apps/api/src/domain/](apps/api/src/domain/) for within-row state-machine and invariants (pure, no I/O) → repositories under [apps/api/src/db/repositories/](apps/api/src/db/repositories/) (one file per table, every fn takes `Tx | typeof db`; each publishes a typed `*Repo` interface that the bound object `satisfies`, so use cases depend on the contract not the named exports).
- **web slice** — `routes/`, `components/`, `hooks/` (TanStack Query), `api.ts` (typed client).

Cross-slice rules (enforced by ESLint):

- Routes may not import another slice's routes.
- Use cases may call other slices' **use cases**, but never another slice's **repository**. Cross-slice calls must follow the acyclic graph in [docs/dev_plan.md](docs/dev_plan.md) §1.3.
- Use cases and routes may not import `drizzle-orm`, `drizzle-orm/*`, or `db/schema` directly — all DB access goes through a repository (`no-drizzle-in-use-cases` lint rule, [DH-01](docs/decisions.md#dh-01--typed-repository-bindings--no-drizzle-in-features-lint-rule)).

### Design system

This was generated in Claude design. Tokens live in [design_handoff_calcey_hours/design/design_system/colors_and_type.css](design_handoff_calcey_hours/design/design_system/colors_and_type.css) and are mapped into Tailwind v4 via `@theme` in [apps/web/src/index.css](apps/web/src/index.css). Use token names directly (`bg-tropical-magenta`, `text-ink-1000`, …). Fonts: **Red Hat Display** (local variable font in `apps/web/public/fonts/`) for body, **Red Hat Mono** for overlines and tabular numerals.

## What GenAI got right (and what it didn't)

This codebase was built end-to-end with Claude Code, one chat per stage, against an authoritative dev plan and decisions log. The patterns below are worth knowing if you're picking up this style of workflow.

### What worked well

- **Stage-gated plan + decisions log as scaffolding.** [docs/dev_plan.md](docs/dev_plan.md), [docs/progress.md](docs/progress.md), and [docs/decisions.md](docs/decisions.md) gave each session a place to anchor: read the gate, do the work, log the decision. Without them, sessions drifted.
- **Predictive hazard calls.** The auth-hook permission trap ([D0-09](docs/decisions.md#d0-09--b9-supabase_auth_admin-grants-in-the-same-migration-as-the-hook-function)) — `supabase_auth_admin` missing `public` schema grants, which silently locks out every user the moment a token is issued — was caught at planning time and the three grants were bundled into the same migration as the hook function.
- **Defence-in-depth at the DB.** Composite FK `(project_id, task_id)` ([D0-03](docs/decisions.md#d0-03--b3-composite-fk-for-taskproject-consistency)) and a `timer_sessions.status` discriminator ([D0-10](docs/decisions.md#d0-10--b10-timer_sessions-status-column-accepted)) both prevent classes of bugs that service-only checks would have missed.
- **Cross-slice rules made executable.** A ≈60-line local ESLint plugin ([D0-13](docs/decisions.md#d0-13--eslint-cross-slice-enforcement-via-local-plugin)) turns the dev plan's import rules into CI failures instead of code-review folklore.
- **Pure utilities tested without a harness.** The transition guard (`canTransition`) is a pure function with no DB imports — full transition matrix unit-tested without mocks. It started as a standalone shared module ([D5-01](docs/decisions.md#d5-01--pure-state-machine-in-sharedstate-machinets)) and was later folded into `domain/time-entry.ts` during the hardening pass ([DH-02](docs/decisions.md#dh-02--timeentry-domain-entity-folds-d5-03-amendment-logic-into-one-place)) to co-locate it with the entity that owns the invariants.
- **Hardening pass after the slices stabilised.** Once Stage 6 landed, a focused pass added typed `*Repo` interfaces + a `no-drizzle-in-use-cases` lint rule ([DH-01](docs/decisions.md#dh-01--typed-repository-bindings--no-drizzle-in-features-lint-rule)) — turning the convention that had drifted in `6c9aee1` into a CI failure — and pulled within-row state-machine and invariants into `domain/` entities ([DH-02](docs/decisions.md#dh-02--timeentry-domain-entity-folds-d5-03-amendment-logic-into-one-place) for `TimeEntry`, [DH-03](docs/decisions.md#dh-03--user-domain-entity-folds-activeinactive-and-self-as-manager-invariants) for `User`). A subsequent CQS pass replaced `service.ts` files with `useCases/*/commands.ts + queries.ts`, separating reads from writes and tightening the `routes → useCases → domain` dependency chain. The patterns to extract were obvious by then; doing this earlier would have been speculation.

### Where it slipped

- **Monoliths first, modularity later.** Every page was initially built as one large component, and every API slice landed as a single `service.ts`. Both required extraction passes: page components were broken apart into modular pieces (Projects, Team, Daily Log, Weekly Summary, Approvals), and `service.ts` files were refactored into `useCases/*/commands.ts + queries.ts` to enforce CQS and tighten the dependency chain. The architecture was sound; the first pass per slice wasn't.
- **Repo-layer rule violated in-slice.** Despite the dev plan §1.3 stating repositories own DB access, the projects service was first written with inline Drizzle queries and had to be reworked in `6c9aee1` ("Move inline Drizzle queries from projects service into repositories"). The rule existed; the first implementation drifted past it.
- **Env-fragile module-load init.** JWKS was originally created at module load, so `pnpm --filter api dev` crashed before `SUPABASE_URL` was wired up. Fixed by switching to lazy init on first request ([D1-02](docs/decisions.md#d1-02--jwks-lazily-initialized-in-auth-middleware)). Same shape of bug in `drizzle.config.ts` ([D1-04](docs/decisions.md#d1-04--drizzleconfigts-allows-empty-database_url-for-dbgenerate)), which threw on missing `DATABASE_URL` and blocked `db:generate` from running without a live DB.
- **Type-system corner missed.** Zod `.default()` + `react-hook-form`'s `zodResolver` + `exactOptionalPropertyTypes: true` produce a type mismatch that isn't obvious until you wire the form ([D4-02](docs/decisions.md#d4-02--local-form-schema-in-teampage-bypasses-default-exactoptionalpropertytypes-conflict)). Resolved with a local form schema, but it's the kind of three-way interaction GenAI didn't anticipate up front.
- **A real functional regression.** Date navigation in the daily log shipped broken and was fixed in `2ad165f` ("Fix date nav bug"). Type-checks and tests passed; the bug was visible only by using the page.

The pattern is consistent: GenAI was strong at the parts the dev plan and ADRs made explicit, weaker at the parts that only show up under hands-on use (UI decomposition, type-system corners, behavioural regressions in interaction-heavy pages).

## Further reading

- [docs/dev_plan.md](docs/dev_plan.md) — authoritative staged build plan (Stages 0–9, gates, RLS policies)
- [docs/decisions.md](docs/decisions.md) — architectural decisions with rationale
- [docs/progress.md](docs/progress.md) — per-stage gate checklist
- [CLAUDE.md](CLAUDE.md) — Claude Code instructions for this repo
- [design_handoff_calcey_hours/README.md](design_handoff_calcey_hours/README.md) — full design spec
