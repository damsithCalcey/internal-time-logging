# Time Logging App — Development Plan

**Source documents:** BRD v1.3 (21 May 2026), ERD v1.2 (HTML/Mermaid)
**Target release:** MVP v1.0
**Architecture:** pnpm monorepo, React SPA + Hono BFF, Supabase Postgres, vertical slices

---

## 0. How to use this plan

Stages run in order. Each ends with a **gate** containing testable criteria. Do not progress past a gate until every item passes. FR-IDs reference BRD v1.3 §6.

This document is the single source of truth for build sequencing. The BRD owns functional behaviour; this plan owns structure, gates, and architectural decisions.

---

## 1. Stack & architecture

### 1.1 Tech stack

**Monorepo**
- pnpm workspaces.
- Turborepo for task orchestration (build, test, lint, typecheck pipelines with caching). Optional but recommended.

**Frontend — `apps/web`**
- React 19 + TypeScript.
- Vite for dev server and bundling.
- `react-router-dom` v6 with route-level guards.
- TanStack Query for all server state.
- React Hook Form + Zod for forms (Zod schemas imported from the shared package).
- Tailwind CSS for styling.
- `@supabase/supabase-js` v2 — used **only** for auth (login/logout/session/refresh). All data calls go through the BFF.
- `date-fns` for ISO week handling.

**Backend for Frontend — `apps/api`**
- Hono running on Node via `@hono/node-server`.
- Drizzle ORM + `postgres` (porsager driver) for Postgres access.
- `jose` for JWT signature verification against Supabase's JWKS endpoint.
- Zod for request validation (schemas shared with frontend).
- `pino` for structured logging.
- Drizzle Kit for migrations; migrations live in `apps/api/migrations` and are committed.

**Database**
- Supabase-hosted Postgres.
- Supabase Auth (email + password, no self-signup per FR-05).
- Supabase Auth Hook (`custom_access_token_hook`) injects role and is_active into the JWT — see §1.4.

**Hosting**
- Frontend: static SPA on Vercel, Netlify, or Cloudflare Pages.
- BFF: Node container on Fly.io, Railway, or Render. Single replica for MVP.
- DB + Auth: Supabase project.

### 1.2 Monorepo layout

```
time-logging/
├── apps/
│   ├── web/                        # React SPA
│   │   ├── src/
│   │   │   ├── app/                # router, providers, app shell
│   │   │   ├── features/           # vertical slices
│   │   │   │   ├── auth/
│   │   │   │   ├── projects/
│   │   │   │   ├── tasks/
│   │   │   │   ├── time-entries/
│   │   │   │   ├── approvals/
│   │   │   │   ├── daily-log/
│   │   │   │   ├── weekly-summary/
│   │   │   │   ├── timer/
│   │   │   │   └── admin-users/
│   │   │   └── shared/             # UI primitives, http client, utils
│   │   └── vite.config.ts
│   └── api/                        # Hono BFF
│       ├── src/
│       │   ├── app/                # server bootstrap, route registration, middleware
│       │   ├── features/           # vertical slices, parallel to web
│       │   │   ├── auth/
│       │   │   ├── projects/
│       │   │   ├── tasks/
│       │   │   ├── time-entries/
│       │   │   ├── approvals/
│       │   │   ├── daily-log/
│       │   │   ├── weekly-summary/
│       │   │   ├── timer/
│       │   │   └── admin-users/
│       │   ├── db/
│       │   │   ├── client.ts       # Drizzle client + connection pool
│       │   │   ├── schema.ts       # Drizzle schema (all tables)
│       │   │   ├── tx.ts           # transaction helper
│       │   │   └── repositories/   # shared data-access layer (§1.3)
│       │   │       ├── users.ts
│       │   │       ├── projects.ts
│       │   │       ├── tasks.ts
│       │   │       ├── user-projects.ts
│       │   │       ├── time-entries.ts
│       │   │       └── timer-sessions.ts
│       │   └── shared/             # auth middleware, error handling, logger
│       ├── migrations/             # drizzle-generated SQL
│       └── drizzle.config.ts
├── packages/
│   ├── shared-types/               # Zod schemas, DTOs, domain enums
│   ├── tsconfig/                   # shared tsconfig presets
│   └── eslint-config/              # shared eslint preset
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### 1.3 Vertical slices and the shared data-access layer

The slice boundary in this project is **between services, not between slices and tables**. Tables are domain data; they belong to no single slice. Slices own user-facing behaviour.

**Three layers per BFF slice:**
- **Routes** (`apps/api/src/features/<slice>/routes.ts`) — Hono handlers, request validation, response shaping. Calls its own slice's service only.
- **Service** (`<slice>/service.ts`) — business logic, authorization checks beyond role gates, orchestration. May call any repository. May call other slices' services only if declared in the acyclic dependency graph below. May not import other slices' routes.
- **Repository** (`apps/api/src/db/repositories/<table>.ts`) — Drizzle queries against one table. Every function accepts a `Tx | typeof db` as its first argument so the same call works inside or outside a transaction. Repositories may not import services.

Frontend slices follow the same idea: `routes/`, `components/`, `hooks/` (TanStack Query), `api.ts` (typed BFF client calls). Cross-slice imports go through `shared/` or `@shared-types`.

**Why the original "no cross-slice service imports" rule was the problem.** The v1 rule ("services may not call other slices' services") forced cross-slice orchestration through repositories, which bypasses any business logic, caching, or side-effects the owning slice's service applies. The solution is not an event bus — it is a narrower rule: **services may call other slices' services, but never other slices' repositories, for cross-slice work. Cross-slice service calls must follow a declared acyclic dependency graph.**

**Declared acyclic dependency graph (BFF service layer):**

```
admin-users  →  time-entries
admin-users  →  timer
approvals    →  (none; uses timeEntriesRepo directly — in-slice for an approval service)
(all others) →  (none)
```

Arrows are one-way. `time-entries` must never import `admin-users/service`. `timer` must never import `admin-users/service`. No cycles. Adding a new cross-slice call that would create a cycle is a blocking code-review failure.

**How this achieves encapsulation.** When `admin-users/service.deactivate()` calls `timeEntriesService.rejectAllSubmittedFor(tx, userId, note)`, all of the `time-entries` slice's business logic — today a DB write; tomorrow also a cache invalidation or audit log — lives inside that service function. The caller passes a `tx` so the work joins the same transaction. The `admin-users` slice never needs to change when `time-entries` adds new side-effects.

**Enforced by lint:** an ESLint rule (`no-restricted-imports`) prevents any service from importing another slice's *repository* for cross-slice orchestration (errors), and flags cross-slice service calls not listed in the dependency graph above (warnings that require a comment justifying the addition and a graph update).

**Cross-slice writes example (deactivation):**

```ts
// apps/api/src/features/admin-users/service.ts
import { withTx } from '@/db/tx'
import * as usersRepo from '@/db/repositories/users'
import * as timeEntriesService from '@/features/time-entries/service'
import * as timerService from '@/features/timer/service'
import { supabaseAdmin } from '@/shared/supabase-admin'
import { logger } from '@/shared/logger'

export async function deactivate(userId: string) {
  const systemNote = 'Automatically rejected: user account deactivated.'
  await withTx(async (tx) => {
    await usersRepo.setActive(tx, userId, false)
    // Each called service owns its own business logic, executed inside this transaction.
    await timeEntriesService.rejectAllSubmittedFor(tx, userId, systemNote)
    await timerService.discardActiveSessionFor(tx, userId)
  })
  try {
    await supabaseAdmin.auth.admin.signOut(userId)
  } catch (err) {
    logger.error({ err, userId }, 'signOut after deactivation failed')
    // Do not throw: DB state is correct; access token expires within TTL.
  }
}
```

The same pattern applies wherever a transaction spans slices. Within a single slice (e.g., `approvals/service.ts` writing through `timeEntriesRepo`) no cross-slice call is needed — that is a direct, in-slice operation on a shared table.

### 1.4 Authentication & authorization

The BFF is the only path to data. Authorization decisions live in `apps/api/src/features/*/service.ts`.

**DB grants:**
- BFF connects with a dedicated DB role with `SELECT, INSERT, UPDATE` on the schema's tables (or the Supabase service role for simplicity in MVP).
- Supabase `authenticated` and `anon` roles get `REVOKE ALL` on every table in the public schema. The first migration includes this.
- RLS is set to `deny-all` for `authenticated` and `anon` as belt-and-braces. Without grants, RLS is redundant, but the policy makes intent explicit and survives a future grant slip.

**Supabase Auth Hook (`custom_access_token_hook`):**
- A `SECURITY DEFINER` Postgres function registered under Supabase Dashboard → Authentication → Hooks.
- On every token issuance (login or refresh), the hook reads `public.users` for the user and injects `role` and `is_active` into the JWT's `app_metadata`.
- Sample implementation:

```sql
-- ⚠️  These three grants MUST be in the same migration as the function.
-- supabase_auth_admin (the Auth service daemon's role) has no access to
-- the public schema by default. Without these, every login and token
-- refresh throws an unhandled DB error and locks ALL users out instantly.
grant usage on schema public to supabase_auth_admin;
grant select on table public.users to supabase_auth_admin;

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql security definer as $$
declare
  claims jsonb;
  user_role text;
  user_active boolean;
begin
  select role::text, is_active
    into user_role, user_active
    from public.users
    where id = (event->>'user_id')::uuid;

  claims := event->'claims';
  claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(coalesce(user_role, 'employee')));
  claims := jsonb_set(claims, '{app_metadata,is_active}', to_jsonb(coalesce(user_active, false)));

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
```

> **Auth hook permission trap.** The `supabase_auth_admin` role that the Auth service daemon uses has no permissions on the `public` schema by default. The `GRANT USAGE` and `GRANT SELECT` lines above must be in the **same migration** as the hook function — not a separate follow-up migration. Omitting them causes a complete login outage the moment the first user tries to authenticate. Verify their presence before running Stage 1 migrations against any non-local environment.

- Access token TTL is set to **15 minutes** in Supabase Auth settings. This bounds how long a stale `role` or `is_active` value can live in a JWT before the next refresh re-runs the hook.

**Request authentication (BFF middleware):**
1. Frontend calls Supabase Auth directly for login. Receives JWT.
2. Frontend stores JWT via `@supabase/supabase-js` (localStorage; library handles refresh).
3. Frontend sends every BFF request with `Authorization: Bearer <jwt>`.
4. BFF middleware verifies the JWT using Supabase's JWKS:
   ```ts
   const JWKS = createRemoteJWKSet(
     new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
   )
   const { payload } = await jwtVerify(token, JWKS, {
     issuer: `${process.env.SUPABASE_URL}/auth/v1`,
   })
   ```
5. Middleware extracts `sub` (user id), `app_metadata.role`, `app_metadata.is_active` from the verified payload and attaches `{ id, role, isActive }` to the Hono context.
6. If `isActive` is false → 403. If `role` is missing → 401 (hook misconfigured).
7. No DB lookup on the request path.

**Why this is safe:**
- JWT signature is verified against keys fetched live from Supabase JWKS. No shared secret on the BFF. Key rotation is automatic.
- 15-minute access token TTL keeps role/is_active staleness bounded.
- On deactivation, the admin signOut call invalidates refresh tokens, so a deactivated user has at most 15 minutes of usable access from any existing token, and cannot obtain a new one. This is the trade-off accepted for skipping a per-request DB lookup. Document it.

**Authorization (per slice):**
- Every Hono route declares its allowed roles via middleware: `requireRole('manager')` or `requireAuth()`.
- Resource-level checks ("this is my entry") live in the service layer after the role check.

### 1.5 `timer_sessions` status column

The BRD schema for `timer_sessions` (§5.2) specifies only `stopped_at` and `time_entry_id` to track session state. That is insufficient to discriminate three distinct terminal states:

| State | `stopped_at` | `time_entry_id` | Meaning |
|---|---|---|---|
| `active` | NULL | NULL | Timer is running |
| `stopped` | NOT NULL | NULL | Timer stopped; awaiting user save or discard |
| `saved` | NOT NULL | NOT NULL | Linked to a time entry |
| `discarded` | NOT NULL | NULL | User chose not to save |

`stopped` and `discarded` share identical column values. Without a discriminator, the `POST /timer/start` guard — which must block new timers while a `stopped` session awaits the user's decision — cannot distinguish a session the user still needs to act on from one they already discarded. A user who discards a session will be permanently locked out of starting future timers.

**Fix: add a `status` column to `timer_sessions`:**

```sql
status  TEXT  NOT NULL  DEFAULT 'active'
        CHECK (status IN ('active', 'stopped', 'saved', 'discarded'))
```

State transitions:

- `POST /timer/start` → inserts row with `status = 'active'`
- `POST /timer/stop` → sets `stopped_at = now()`, `status = 'stopped'`
- `POST /timer/sessions/:id/save` → sets `time_entry_id`, `status = 'saved'`
- `DELETE /timer/sessions/:id` (discard) → sets `status = 'discarded'` (row kept for audit)
- Deactivation handler (`timerService.discardActiveSessionFor`) → sets `stopped_at = now()`, `status = 'discarded'` — **never `stopped`**, which is the user-interactive pending-save state

`POST /timer/start` blocks only when a row exists with `status IN ('active', 'stopped')` for that user. `discarded` and `saved` rows are terminal and do not block.

The partial unique index from BRD §5.3 (`UNIQUE (user_id) WHERE stopped_at IS NULL`) covers the `active` case already. Add a second partial index for the pending-save constraint: `UNIQUE (user_id) WHERE status = 'stopped'`. This enforces at DB level that a user can have at most one pending-save session at a time.

The `status` column is an **implementation-level addition** not present in the BRD schema spec. Flag it in the §2.1 decisions log (B10) and confirm the BRD author is aware. The BRD's behavioural requirements (FR-41, FR-48, FR-49) are unchanged; this column is the mechanism that makes those requirements safely implementable.

---

## 2. Issues to resolve before Stage 1

### 2.1 Blocking (close at Stage 0 gate)

**B1 — ERD drift.** ERD v1.2 is missing `amended_at`, `amended_by`, `original_hours` on `time_entries` (BRD §5.2). Regenerate the ERD against BRD v1.3.

**B2 — `chk_manager_role` should not be a DB CHECK constraint.** PostgreSQL CHECKs don't re-evaluate when other rows change; demoting a manager would leave dangling `users.manager_id` references. Replace with BFF service-level enforcement in `admin-users/service.ts`:
- On any change to `users.manager_id`, the service validates the target row's role is `manager`.
- On any change to `users.role` from `manager` to `employee`, the service blocks if any rows still reference the user as their manager.

The DB CHECK is removed from the schema.

**B3 — Task–project consistency at the DB.** Add `UNIQUE (id, project_id)` on `tasks`; replace the simple FK on `time_entries.task_id` and `timer_sessions.task_id` with a composite FK `(project_id, task_id) → tasks (project_id, id)`. Application service also validates this, but the DB constraint is cheap defense-in-depth.

**B4 — `auth.users → public.users` sync.** Recommended: a `POST /admin/users` endpoint on the BFF (manager-only) that creates the Supabase Auth user via the admin API and the `public.users` row in the same workflow (admin API call, then DB insert; rollback the auth user if the DB insert fails). Alternative: a `SECURITY DEFINER` trigger on `auth.users` insert. Confirm which.

**B5 — DB driver / ORM confirmation.** Plan assumes Drizzle ORM. Confirm or substitute (Kysely is the closest alternative).

**B6 — Hono runtime confirmation.** Plan assumes Node via `@hono/node-server`. Confirm or substitute.

**B7 — Hosting decisions.** Confirm targets for the SPA, the BFF container, and the Supabase project. Required outputs:
- BFF public URL (for the frontend's CORS allow-list).
- Region.
- Backup/restore expectations (Supabase managed; document RTO/RPO).

**B8 — Access token TTL confirmation.** Plan recommends 15 minutes. Stakeholders may want longer for UX (fewer silent refresh cycles) or shorter for security. Decide before Stage 1.

**B9 — Auth hook `supabase_auth_admin` permission grants.** The `supabase_auth_admin` role has no access to the `public` schema by default. The three grants — `GRANT USAGE ON SCHEMA public TO supabase_auth_admin`, `GRANT SELECT ON TABLE public.users TO supabase_auth_admin`, and `GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin` — must land in the **same migration** as the hook function (see §1.4). Omitting them produces an unhandled DB error on every token issuance, locking all users out immediately. Verify in Stage 1 gate before applying migrations to any shared environment.

**B10 — `timer_sessions.status` column (§1.5).** The BRD schema spec does not include this column. Confirm with the BRD author that the implementation-level addition is acceptable before Stage 1 migrations are committed. The behavioural requirements (FR-41, FR-48, FR-49) are unchanged; the column is necessary to implement them correctly.

### 2.2 Address at the relevant stage

**S1 — Daily 24h cap on edit.** Service check must exclude the row being edited: `SUM(hours) WHERE user_id = ? AND entry_date = ? AND id <> ?`. Implement in `time-entries/service.ts`. (Stage 4.)

**S2 — Atomic deactivation workflow (FR-05a, expanded).** Implement in `admin-users/service.deactivate()` as a single Drizzle transaction. Cross-slice work goes through the owning slices' service functions (§1.3 acyclic graph), passing `tx` so all writes join the same transaction:

```ts
await withTx(async (tx) => {
  await usersRepo.setActive(tx, userId, false)
  await timeEntriesService.rejectAllSubmittedFor(tx, userId, systemNote)
  await timerService.discardActiveSessionFor(tx, userId)
  // timerService.discardActiveSessionFor sets status='discarded', not 'stopped' (§1.5)
})
```

After the transaction commits, call Supabase admin `signOut(userId)` outside the DB transaction to invalidate refresh tokens. The two-step is acceptable: if the DB commits but signOut fails, log and alert; the deactivation has taken effect on the data plane and the access token expires within TTL. (Stage 1 + Stage 4.)

**S3 — Timer pre-fill rounding edge case (FR-49b).** For elapsed time under 15 minutes, nearest 0.5h is 0, which fails `hours > 0`. UI detects and offers "round to 0.5" or "discard". (Stage 7.)

**S4 — `original_hours` across repeated amendments.** Recommend: populate once on first `approved → amended` transition; never overwritten on subsequent amends. Confirm with BA at Stage 5 gate.

**S5 — OI-06 (JWT in localStorage).** Threat-modelled and signed off at Stage 9. Default for MVP: accept localStorage, document the XSS exposure, plan post-launch migration to httpOnly cookies if warranted (requires significant Supabase Auth refactor — BFF would broker auth).

**S6 — OI-07 (cross-device timer sync).** Refresh-based reconciliation only. `GET /timer/active` is called on app load and route changes. No realtime subscription. Confirm at Stage 0 gate.

### 2.3 Schema additions

- Add `updated_at` to `projects`, `tasks`, `users`, or drop the "apply the same pattern" guidance from BRD §5.3. Recommended: add the columns; the `updated_at` trigger is one shared SQL function applied to four tables.
- `timer_sessions.status` column: `TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stopped', 'saved', 'discarded'))`. Add a second partial unique index `UNIQUE (user_id) WHERE status = 'stopped'` alongside the BRD-specified `UNIQUE (user_id) WHERE stopped_at IS NULL` (see §1.5). Confirm with BRD author (B10).
- Indexes for the 2-second performance target (BRD §7):
  - `time_entries (user_id, entry_date DESC)` — daily log & cap check
  - `time_entries (status)` — approval queue
  - `time_entries (project_id, entry_date)` — manager project filtering
  - `user_projects (project_id)` — composite PK covers the `(user_id, project_id)` direction; add this for the reverse
  - `tasks (project_id)` — task dropdown filter
  - `timer_sessions` partial unique indexes are already specified above

---

## 3. Stages and gates

### Stage 0 — Discovery & monorepo scaffold

**Scope.** Close B1–B8 (§2.1). Assign target dates to OI-01–OI-07. Stand up the monorepo skeleton.

**Deliverables:**
- ERD updated to match BRD v1.3.
- Decisions log capturing B1–B8 outcomes and §2.3 additions.
- pnpm workspace with empty `apps/web`, `apps/api`, `packages/shared-types`, `packages/tsconfig`, `packages/eslint-config`.
- Both apps build and run with a placeholder route / hello-world page.
- A single shared Zod schema imported by both apps via `@shared-types`, proving cross-package type wiring.
- Supabase dev project provisioned. Env vars wired locally in `.env.local` (gitignored). Required vars:
  - Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`
  - BFF: `SUPABASE_URL`, `SUPABASE_JWT_ISSUER`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `PORT`
- Drizzle Kit configured against the Supabase Postgres URL.
- CI pipeline runs `pnpm typecheck`, `pnpm lint`, `pnpm test` on PRs.
- ESLint rule configured to block cross-slice repository imports (`no-restricted-imports` with patterns — errors). Cross-slice service imports not listed in the §1.3 acyclic dependency graph emit lint warnings.
- Acyclic service dependency graph documented in `apps/api/src/features/README.md`.

**Gate:**
- `pnpm install` from a clean clone succeeds.
- `pnpm --filter web dev` serves a page.
- `pnpm --filter api dev` serves a Hono `GET /health` returning `{ ok: true }`.
- Shared Zod schema importable from both apps; a deliberate breaking change in `@shared-types` causes both apps' typecheck to fail.
- `pnpm db:push` (Drizzle) applies an empty schema to the dev DB.
- ESLint errors on a deliberately-introduced cross-slice repository import; warns on an undocumented cross-slice service import.
- All B-items (B1–B10) closed; OI items have owners and target dates.

---

### Stage 1 — Database schema, auth seam, repositories

**Scope.**
- Drizzle schema for every table in BRD §5.2 plus §2.3 additions and §2.1 fixes.
- All CHECK, FK, NOT NULL, UNIQUE constraints from BRD §5.2 and §5.3.
- Composite FK for task–project consistency (B3).
- `timer_sessions.status` column (`active | stopped | saved | discarded`) with partial unique indexes: `UNIQUE (user_id) WHERE stopped_at IS NULL` (BRD-specified) and `UNIQUE (user_id) WHERE status = 'stopped'` (§1.5, B10).
- Case-insensitive uniqueness: `UNIQUE` indexes on `lower(name)` for projects, and `(project_id, lower(name))` for tasks.
- `updated_at` trigger applied to `time_entries`, `projects`, `tasks`, `users`.
- Revoke grants from `authenticated` and `anon`; add deny-all RLS policies as belt-and-braces.
- Custom access token hook function created with all required grants in a single migration (see §1.4): `GRANT USAGE ON SCHEMA public TO supabase_auth_admin`, `GRANT SELECT ON TABLE public.users TO supabase_auth_admin`, `GRANT EXECUTE ON FUNCTION ... TO supabase_auth_admin`. All three must be present; a missing grant causes a total login outage (B9).
- Hook registered in Supabase Auth dashboard (Dashboard → Authentication → Hooks → Custom Access Token).
- Access token TTL set to the value confirmed in B8.
- All §2.3 performance indexes created.

**Repositories (in `apps/api/src/db/repositories/`):**
Each repository exposes a small, stable surface. Example for users:

```ts
// db/repositories/users.ts
import type { Tx } from '@/db/tx'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

type DB = Tx | typeof db

export const findById = (d: DB, id: string) =>
  d.select().from(users).where(eq(users.id, id)).then(r => r[0] ?? null)

export const setActive = (d: DB, id: string, isActive: boolean) =>
  d.update(users).set({ isActive }).where(eq(users.id, id))

// …
```

Stage 1 ships these primitives for `users`, `projects`, `tasks`, `user_projects`, `time_entries`, `timer_sessions`. Specific query methods (e.g. `autoRejectSubmittedFor`, `hardStopActiveFor`) are added as later stages need them — start with CRUD plus the ones already known to be required.

**BFF middleware and `/me`:**
- JWT verification middleware using `jose` + `createRemoteJWKSet` pointed at Supabase's JWKS endpoint.
- `requireAuth()` and `requireRole(role)` Hono middlewares.
- `GET /me` returns the current user from the JWT claims (no DB lookup).
- `withTx(fn)` transaction helper that wraps Drizzle's `db.transaction`.

**Seed script:**
- One manager, two employees (one reporting to the manager), one project with two tasks, one `user_projects` assignment.

This stage proves the seam works end-to-end without yet implementing any business features.

The accounts MUST be plus addressed against damsith@calcey.com e.g. damsith+emp1@calcey.com

**Gate:**
- Migrations apply cleanly to a fresh empty Supabase project. Down-migrations also run cleanly.
- DB-level negative tests pass (raw SQL against the BFF's DB user):
  - `INSERT … hours = 0.3` fails.
  - `INSERT … hours = 25` fails.
  - `INSERT … entry_date = tomorrow` fails.
  - `INSERT time_entries` with a task from a different project than `project_id` fails (composite FK).
  - `INSERT timer_sessions` for a user with an existing `stopped_at IS NULL` row fails.
  - Duplicate `(project_id, lower(name))` task insert fails.
  - Duplicate `lower(name)` project insert fails.
  - Deleting a project with referencing tasks/entries fails (RESTRICT).
- Grants negative test: a `psql` session as Supabase's `authenticated` role with a valid JWT can `SELECT 1` but `SELECT * FROM time_entries` is denied at the grant level.
- The custom access token hook migration includes all three `supabase_auth_admin` grants. Verify by querying `information_schema.role_table_grants` and `pg_proc` — `supabase_auth_admin` must have `USAGE` on `public`, `SELECT` on `public.users`, and `EXECUTE` on the hook function before the hook is registered in the Auth dashboard.
- The custom access token hook is registered and works: a fresh login returns a JWT whose `app_metadata.role` and `app_metadata.is_active` match the seed user's DB row.
- Changing a user's role then refreshing the access token reflects the new role in the JWT.
- `GET /me` returns 200 with the seeded manager's claims using a valid JWT.
- `GET /me` returns 401 with no token, an expired token, or a token whose signature fails JWKS verification.
- `GET /me` returns 403 when `app_metadata.is_active` is false.
- All repositories have at least one happy-path unit test using the test DB.

---

### Stage 2 — Frontend shell & auth slice

**Scope.** FR-01 to FR-04. Slice: `apps/web/src/features/auth/`.

**Slice contents:**
- Login route component.
- `useLogin` / `useLogout` hooks wrapping `@supabase/supabase-js`.
- `AuthProvider`: holds the Supabase session, fetches `/me` via TanStack Query on session change, exposes `{ user, role, isLoading }` via context.
- `<RequireAuth>` and `<RequireRole>` route guards.
- HTTP client (`apps/web/src/shared/http.ts`): wrapper that injects `Authorization: Bearer <jwt>` from the live Supabase session and surfaces typed errors.

**App shell:**
- Layout with role-aware navigation (manager sees Projects, Approvals, Admin; employee does not).
- Loading skeleton while `/me` resolves.
- Mobile-first responsive layout (drawer nav under 768px; single-column under 640px).

**Gate:**
- Login with seed credentials lands on the dashboard.
- Invalid credentials show an inline error.
- Hard reload preserves the session.
- Logout clears the session and redirects to `/login`.
- `/app/*` redirects to `/login` when unauthenticated, preserving the return URL.
- The HTTP client automatically attaches the bearer token; clearing localStorage and refreshing forces re-login.
- Manager and employee sessions see different nav items.
- No horizontal scroll at 375px or 1280px.
- Production build produces a static bundle deployable to any CDN.

---

### Stage 3 — Projects & Tasks slice (manager-only)

**Scope.** FR-06 to FR-10.

**BFF — `apps/api/src/features/projects/` and `…/tasks/`:**
- `POST /projects`, `GET /projects`, `GET /projects/:id`, `PATCH /projects/:id` (manager only).
- `POST /projects/:id/tasks`, `GET /projects/:id/tasks`, `PATCH /tasks/:id` (manager only).
- `POST /projects/:id/assignments`, `DELETE /projects/:id/assignments/:userId` (manager only).
- `GET /projects?for=time-entry&user=<id>` returns only projects with at least one task — what the employee time-entry dropdown calls. Manager mode calls a sibling endpoint returning all projects.
- Name uniqueness validated in service (case-insensitive) before insert; DB constraint catches anything that races through.
- Service always sets `created_by` / `assigned_by` to the calling manager's id.

Routes call `projectsRepo`, `tasksRepo`, `userProjectsRepo` — no cross-slice service imports.

**Frontend slice — `apps/web/src/features/projects/`:**
- Projects list (name, description, created at, # tasks, # assigned users).
- Project detail / edit form.
- Task list within project; add/edit/list.
- User assignment panel (searchable multi-select of active users only).
- Routes only registered for manager role; route guard plus 403 on direct BFF call.

**Gate:**
- Manager creates a project; duplicate name (case-insensitive) returns 409.
- Manager edits a project's name and description.
- Manager creates two tasks; duplicate task name within the project (case-insensitive) returns 409.
- Manager assigns and unassigns a user via `user_projects`. Duplicate assignment returns 409 (composite PK).
- Employee call to `POST /projects` returns 403.
- Employee route `/app/projects` redirects or 403s.
- `GET /projects?for=time-entry` excludes projects with zero tasks.
- Deactivated users do not appear in the assignment user picker.

---

### Stage 4 — Time entries slice (create / edit / submit / withdraw)

**Scope.** FR-11 to FR-23a, FR-18a. Approval queue is Stage 5.

**BFF — `apps/api/src/features/time-entries/`:**
- `POST /time-entries` — creates a draft. Body: `{ userId?, projectId, taskId, entryDate, hours, notes? }`. `userId` accepted only when caller role is manager (FR-18a); for employees it is ignored and set to the caller.
- `PATCH /time-entries/:id` — edits with status-aware rules:
  - Employee editing own entry: allowed when status is `draft` or `rejected`. On successful save of a `rejected` entry, status transitions to `draft`.
  - Manager: any entry, any status. Manager edit of `approved` triggers the amendment side-effect (Stage 5).
- `POST /time-entries/:id/submit` — transitions `draft → submitted`.
- `POST /time-entries/:id/withdraw` — transitions `submitted → draft` with race protection:
  ```sql
  UPDATE time_entries SET status='draft'
  WHERE id = ? AND status = 'submitted'
  RETURNING id
  ```
  Zero rows returned → respond 409 with code `entry-already-actioned`.
- Validation: BRD §6.3 rules implemented as Zod refinements on the request schema plus service-layer checks for the daily cap (S1) and project assignment.

Routes call `time-entries/service.ts`, which uses `timeEntriesRepo` and `userProjectsRepo`. Per §1.3, no cross-slice service calls originate from `time-entries/service.ts`.

**Admin-users slice — `apps/api/src/features/admin-users/`:**

This is the first stage that needs the deactivation workflow, so the admin-users slice ships here.

- `POST /admin/users` (manager only) — creates an auth user via Supabase admin API and inserts the public.users row.
- `PATCH /admin/users/:id` (manager only) — edit role, full name, manager_id. Enforces B2 rules in service.
- **No `DELETE /admin/users/:id` endpoint.** Hard delete of users is explicitly blocked per BRD §5.3. The only path to removing a user's access is deactivation. Any HTTP DELETE on a user ID returns 405.
- `POST /admin/users/:id/deactivate` (manager only) — runs the S2 workflow via acyclic service-to-service calls (§1.3):

```ts
// apps/api/src/features/admin-users/service.ts
import { withTx } from '@/db/tx'
import * as usersRepo from '@/db/repositories/users'
import * as timeEntriesService from '@/features/time-entries/service'
import * as timerService from '@/features/timer/service'
import { supabaseAdmin } from '@/shared/supabase-admin'
import { logger } from '@/shared/logger'

export async function deactivate(userId: string) {
  const systemNote = 'Automatically rejected: user account deactivated.'
  await withTx(async (tx) => {
    await usersRepo.setActive(tx, userId, false)
    // Each service call executes inside the same transaction.
    // timeEntriesService.rejectAllSubmittedFor: sets status='rejected', manager_note=systemNote
    // timerService.discardActiveSessionFor: sets stopped_at=now(), status='discarded' (§1.5)
    await timeEntriesService.rejectAllSubmittedFor(tx, userId, systemNote)
    await timerService.discardActiveSessionFor(tx, userId)
  })
  try {
    await supabaseAdmin.auth.admin.signOut(userId)
  } catch (err) {
    logger.error({ err, userId }, 'signOut after deactivation failed')
    // Do not throw: DB state is correct; access token expires within TTL.
  }
}
```

- `POST /admin/users/:id/reactivate` — sets `is_active = true`. The user returns to a clean timer state: no `stopped` sessions exist for them (their deactivation set `status = 'discarded'`), so they are not forced into a pending-save modal on first login. Does not restore previously-rejected entries.

**Frontend — `apps/web/src/features/time-entries/` and `apps/web/src/features/admin-users/`:**
- Time entry form: project select (Stage 3 endpoints), task select (filtered by selected project), date picker (no future dates), hours input (0.5 step), notes textarea.
- Manager mode adds "On behalf of" user dropdown at the top; form submit body includes `userId`.
- Daily totals widget (calls `GET /time-entries?user=<id>&date=<date>` and sums client-side).
- Submit and Withdraw actions with optimistic UI updates via TanStack Query mutations + invalidation.
- Admin-users slice ships a minimal management screen for managers: list users with deactivate/reactivate toggles, edit role/manager_id.

**Validation summary (Zod schema + service):**
- `hours > 0`, `hours % 0.5 === 0`, `hours <= 24`.
- `entryDate <= today` (picker enforces; service double-checks).
- Daily cap: `SUM(hours)` for `(userId, entryDate)` excluding the edited row, plus the new value, must be ≤ 24 (S1).
- Task belongs to the selected project (DB also catches this).
- Employee: project is in the user's `user_projects`. Manager: any project allowed.

**Gate:**
- Employee creates a draft; all validations fire with clear error responses.
- Employee edits a draft; daily cap correctly excludes the edited row (S1).
- Employee submits; status becomes `submitted`; entry becomes read-only in the UI.
- Employee withdraws; status returns to `draft`. Simulated race (status changed to `approved` between read and withdraw): client sees 409 and refreshes.
- Employee edits a `rejected` entry: status stays `rejected` until save succeeds; on save, status becomes `draft`.
- Employee cannot edit entries with status `submitted`, `approved`, or `amended` (BFF 403).
- Manager creates a time entry on behalf of an employee; `user_id` is the employee's, not the manager's.
- Manager edits an entry of any status. Manager-edit of an approved entry's amendment effects are tested in Stage 5.
- `DELETE /admin/users/:id` returns 405 Method Not Allowed (hard delete blocked per BRD §5.3).
- Deactivation workflow (service orchestration integration test):
  - `users.is_active` flips to false.
  - All `submitted` entries for that user transition to `rejected` with `manager_note` set to the system note (not `notes` — verify the correct column per BRD §5.2). Logic lives in `timeEntriesService.rejectAllSubmittedFor`.
  - Any active timer session for that user has `stopped_at` set and `status = 'discarded'` (not `stopped`). Logic lives in `timerService.discardActiveSessionFor`. Verify the session does **not** appear as a pending-save session on subsequent `GET /timer/active`.
  - Supabase admin signOut is called; the user's existing refresh tokens are invalidated.
  - All three DB writes are in a single transaction: simulate a failure in `timerService.discardActiveSessionFor` (e.g. force a DB error) and verify the entire transaction rolls back — `is_active` is still true, no entries were rejected, timer row is unchanged.
  - Reactivate the user: confirm `GET /timer/active` returns null (no pending-save ghost session).
- Mobile (375px): every field reachable; date picker and hours input usable on touch.

---

### Stage 5 — Approvals slice & amended state

**Scope.** FR-24 to FR-29b. Full state machine from BRD §6.6 lives in `apps/api/src/features/approvals/service.ts`.

**State-machine implementation pattern.** A single `transition(currentStatus, nextStatus, actorRole, options)` function in `apps/api/src/shared/state-machine.ts`. Returns `{ ok: true }` or `{ ok: false, reason }`. All state-changing routes funnel through this. Unit-tested exhaustively at this gate.

**Design rule for `shared/state-machine.ts`: the transition function must remain pure.** It accepts the target row, the desired next status, the actor's role, and an optional payload of pre-fetched contextual data provided by the caller. It must never run its own database queries, import repositories, or produce side-effects. If a transition requires DB context (e.g., verifying a prerequisite), the *calling service* fetches that data and passes it in. This keeps `shared/` a clean utility layer and prevents circular dependencies.

**BFF — `apps/api/src/features/approvals/`:**
- `GET /approvals` (manager only) — filters: `status` (default `submitted`), `userId`, `from`, `to`. Pagination optional for MVP (acceptable if managers see < 200 rows).
- `POST /approvals/:id/approve` — `submitted → approved`. No note required.
- `POST /approvals/:id/reject` — `submitted → rejected`. Body requires non-empty `note`. Zod rejects empty/whitespace; service double-checks.
- Manager edits to `time_entries` (handled by `PATCH /time-entries/:id` in Stage 4) trigger the state-machine when current status is `approved`. Both `time-entries/service` and `approvals/service` import `shared/state-machine.ts` for transition validation. The amendment side-effect (setting `amended_at`, `amended_by`, `original_hours`) is implemented in `time-entries/service.ts` via `timeEntriesRepo`:
  - On manager edit of an `approved` entry: set `status='amended'`, `amended_at=now()`, `amended_by=callerId`, `original_hours=current.hours` if `original_hours IS NULL` (S4: populate once).
  - On subsequent manager edits of an `amended` entry: update `amended_at`, `amended_by`; preserve `original_hours`.

**Frontend slice — `apps/web/src/features/approvals/`:**
- Approval queue route (manager only).
- Filters: user multi-select (active users only), date range.
- Row actions: Approve, Reject (modal with required note), View detail.
- Reject modal blocks submit until note has ≥ 1 non-whitespace character.

**Display:**
- `amended` is visually distinct from `approved`: badge, label, "manager edit" annotation showing manager name, timestamp, and `original_hours`.
- Employee can see `amended` entries on their daily log and weekly summary but cannot edit them (FR-29b).

**Gate:**
- Manager queue shows `submitted` entries; filters work.
- Approve transitions to `approved`.
- Reject without a note: 400 from Zod.
- Reject with a note: transitions to `rejected`, note stored.
- Manager edits an `approved` entry → status `amended`; `amended_at`, `amended_by`, `original_hours` populated.
- Subsequent edit of `amended` → `amended_at` and `amended_by` updated; `original_hours` unchanged (S4).
- Employee cannot edit an `amended` entry (403).
- State-machine unit tests cover the full transition matrix in BRD §6.6 plus negative cases: `approved → submitted` rejected, `rejected → approved` rejected, `draft → approved` rejected, `amended → anything else` rejected (terminal).
- Manager self-edits on `draft`, `submitted`, `rejected`, `amended` that don't change status: status unchanged.

---

### Stage 6 — Daily log & Weekly summary slices

**Scope.** FR-30 to FR-39.

**BFF endpoints:**
- `GET /time-entries/daily?date=YYYY-MM-DD&userId=<id?>` — manager passes any `userId` or omits for all; employee call ignores `userId` and returns own.
- `GET /time-entries/weekly?week=YYYY-Www&userId=<id?>` — ISO week format. Returns entries within Mon–Sun of that ISO week, with user filter applied per role.

The BFF returns raw rows; the frontend pivots client-side because the group-by toggle (project vs task) is client-driven.

**Frontend — `apps/web/src/features/daily-log/` and `…/weekly-summary/`:**

*Daily log:*
- Columns: project, task, hours, notes (truncated/expandable), status badge, actions.
- Date picker defaults to today; past navigation; future disabled.
- Total hours at the bottom.
- Manager view: user filter (all users / specific user); rows show the user column.

*Weekly summary:*
- ISO week boundaries via `date-fns/startOfISOWeek` and `endOfISOWeek`.
- Group-by toggle: project or task. Default: project.
- Each group row: weekly total + per-day breakdown Mon–Sun.
- Grand total row at the bottom.
- Week navigator: previous / next / "this week".
- Manager view: user filter; aggregations recompute per filter.

**Gate:**
- Daily log shows correct entries with correct total.
- Employee sees only own; manager sees all with user filter; manager view of a specific employee matches that employee's own view of the same date.
- Weekly summary correctly aggregates for the selected ISO week.
- Group-by toggle works; project total and task total reconcile to the same grand total.
- Per-day breakdown matches `SUM(hours)` for `(group, date)`.
- Week navigator handles year boundaries and ISO week 53 correctly (test with a known week-53 year).
- Mobile (375px): weekly grid scrolls horizontally inside its container, not the page.

---

### Stage 7 — Timer slice

**Scope.** FR-40 to FR-49b.

**BFF — `apps/api/src/features/timer/`:**
- `POST /timer/start` — body: `{ projectId, taskId }`. Service:
  - Validate the user has access to the project (or is manager).
  - INSERT into `timer_sessions` with `started_at = now()`, `status = 'active'`. Partial unique index `UNIQUE (user_id) WHERE stopped_at IS NULL` enforces one active timer per user; on conflict, return 409 `active-timer-exists`.
  - Return the row including server `started_at`.
- `GET /timer/active` — returns the user's session with `status IN ('active', 'stopped')` or null. This is the pending-action check: `active` means the timer is running; `stopped` means it is awaiting a save/discard decision. Frontend calls on app load and on route changes.
- `POST /timer/stop` — sets `stopped_at = now()`, `status = 'stopped'` for the user's `active` session. Compute `elapsedHours = (stopped_at - started_at) / 3600` server-side; return it.
- `POST /timer/start` — blocked (409) if any session exists with `status IN ('active', 'stopped')` for that user. The partial unique index covers `active`; the `UNIQUE (user_id) WHERE status = 'stopped'` index (§1.5) covers the pending-save case. A `discarded` or `saved` session never blocks.
- `POST /timer/sessions/:id/save` — body matches time-entry create. Service runs in a transaction:

```ts
// apps/api/src/features/timer/service.ts
export async function saveSession(userId: string, sessionId: string, entryInput) {
  return withTx(async (tx) => {
    const session = await timerSessionsRepo.findByIdForUser(tx, sessionId, userId)
    if (!session || session.status !== 'stopped') throw new ConflictError(...)
    const entry = await timeEntriesRepo.createDraft(tx, { ...entryInput, userId })
    await timerSessionsRepo.markSaved(tx, sessionId, entry.id)  // status='saved', time_entry_id=entry.id
    return { entry, session: { ...session, timeEntryId: entry.id, status: 'saved' } }
  })
}

export async function discardActiveSessionFor(tx: Tx, userId: string) {
  // Called by admin-users/service via acyclic service graph (§1.3).
  // Sets status='discarded', stopped_at=now() for any active session.
  // Does NOT set status='stopped' — that is the user-interactive pending-save state.
  await timerSessionsRepo.discardActiveFor(tx, userId)
}
```

- `DELETE /timer/sessions/:id` — user-initiated discard. Service requires `session.status === 'stopped'`. Sets `status = 'discarded'`. Row kept for audit; UI treats it as gone.

**FR-49a — privacy.** Every timer endpoint scopes to `user_id = caller.id`. Managers cannot read or write other users' `timer_sessions`. Enforced in service; tested at the gate.

**Frontend slice — `apps/web/src/features/timer/`:**
- Persistent timer widget in the app shell.
- States derived from `GET /timer/active` response:
  - **Idle**: no active/stopped session. Project select, task select, Start button.
  - **Running**: session `status = 'active'`. Project/task labels, elapsed time HH:MM:SS, Stop button. Tick: `setInterval(1000)` reading `Date.now() - new Date(startedAt).getTime()`. The anchor is the server's `startedAt`; clock skew at the start request is bounded by one round trip and doesn't accumulate.
  - **Stopped-pending-save**: session `status = 'stopped'`. Modal with pre-fill form. Cannot start a new timer in this state (UI guard plus BFF `UNIQUE (user_id) WHERE status = 'stopped'` index).
- On app load: `GET /timer/active` reconciles state.
- Pre-fill (FR-45, FR-46, FR-49b):
  - Display exact elapsed hours to 2 decimal places ("1.23 h elapsed").
  - Pre-fill `hours` input with nearest 0.5h.
  - **S3 edge case**: if elapsed < 15 min, nearest 0.5h is 0 → invalid. UI shows a warning, defaults to 0.5, and offers "Discard instead" as an explicit option.
- All standard time-entry validation applies on save (FR-47).
- Dismiss without save: confirm modal (FR-48); on confirm, call `DELETE /timer/sessions/:id` (sets `status = 'discarded'`); no `time_entries` row created.

**Cross-device behaviour (OI-07):** refresh-based reconciliation only. `GET /timer/active` is called on app load and route changes. No realtime subscription. Document in help text.

**Gate:**
- Start timer: row inserted with `status = 'active'`, server `started_at`.
- Second start attempt for the same user while `status = 'active'`: partial unique index (`WHERE stopped_at IS NULL`) fires; BFF returns 409.
- Attempt `POST /timer/start` while a `stopped` session exists: `UNIQUE (user_id) WHERE status = 'stopped'` fires; BFF returns 409.
- Attempt `POST /timer/start` after a session was `discarded` or `saved`: succeeds cleanly (terminal statuses do not block).
- UI ticks once per second, derived from `started_at`.
- Close tab, reopen: `GET /timer/active` returns the running session; UI resumes correctly.
- Stop timer: session row set to `status = 'stopped'`, `stopped_at` populated. Pre-fill modal shows elapsed to 2dp and hours defaulted to nearest 0.5.
- Stop a timer that ran 8 minutes: UI warns "rounds to 0", defaults to 0.5, offers discard (S3).
- Save: time entry created with `status = 'draft'`; `timer_sessions.time_entry_id` populated and `status = 'saved'` in the same transaction. Force a mid-transaction failure: neither write persists.
- Dismiss without save: confirmation modal; on confirm, `timer_sessions.status = 'discarded'`, no `time_entries` row created.
- Cannot start a new timer while pending-save state is active (BFF returns 409).
- `GET /timer/active` returns null after a session is `discarded` or `saved`.
- Manager attempts `GET /timer/sessions/:id` for another user's session: BFF returns 404 (does not leak existence) (FR-49a).
- Active timer is hard-stopped (via `timerService.discardActiveSessionFor`) when the user is deactivated (already verified at Stage 4 gate); re-verify here that `status = 'discarded'` (not `stopped`) and `GET /timer/active` returns null for that user after reactivation.
- Cross-device: stop on browser A; on browser B's next app load or route change, state reconciles correctly.

---

### Stage 8 — Polish: responsive, accessibility, performance

**Scope.** BRD §7 non-functional requirements.

**Responsive.** Every screen tested at 375px, 768px, 1024px, 1280px. Tables reflow or scroll inside their container, not the page.

**Accessibility:**
- Keyboard tab order logical on every screen.
- ARIA labels on inputs, buttons, icon-only controls.
- Status badges convey via text + colour, not colour alone.
- Modal focus trapping and escape-to-close.
- Form errors via `aria-live="polite"` regions.
- Lighthouse accessibility ≥ 90 on daily log, weekly summary, approval queue, timer.

**Performance:**
- Time entry create + view loads under 2s (BRD §7).
- Test dataset: 5 users × 1 year × ~5 entries/day ≈ 9000 `time_entries` rows.
- §2.3 indexes confirmed in place.
- TanStack Query stale times tuned so the daily log doesn't refetch on every focus.
- BFF p95 latencies recorded via pino logs; target < 200ms per endpoint excluding cold starts.

**Browser matrix.** Smoke test on latest two versions of Chrome, Firefox, Safari, Edge (BRD §7).

**Gate:**
- All views render correctly at 375 / 768 / 1024 / 1280 px.
- Lighthouse a11y ≥ 90 on the four routes above.
- Keyboard-only flow completes: log in → create entry → submit → log out.
- Screen reader smoke (VoiceOver or NVDA): labels and errors announced.
- 9000-row dataset: time-entry create completes in < 500ms; daily log renders < 2s.
- Smoke test passes on the four browsers.

---

### Stage 9 — Pre-launch: security, UAT, sign-off

**Scope.** Close OI-06 (S5). Run UAT. Confirm every item in BRD §10.

**Security review (OI-06):**
- Threat model document: JWT in localStorage, BFF surface area, service-role key handling, JWKS verification reliance, CORS allow-list.
- CSP headers on the SPA deployment: block inline scripts, restrict script sources, restrict `connect-src` to the BFF origin and Supabase Auth.
- BFF: rate limiting on auth-adjacent endpoints (login proxy if any, password reset); CORS allow-list limited to the SPA origin; no debug endpoints in production.
- Secret-handling review: `SUPABASE_SERVICE_ROLE_KEY` is server-only env var, never in the SPA bundle. Confirm by inspecting the production bundle.
- Decision: accept localStorage for MVP or migrate to httpOnly cookies. The cookie option requires the BFF to broker login (significant rework) and is deferred.

**UAT:**
- 2 managers and 4 employees.
- Scripted scenarios: log in, create/edit/submit/withdraw, approval queue, amend, daily/weekly, timer start/stop/save/discard, deactivation workflow.
- Only Sev 1/2 block launch.

**Documentation:**
- Deployment runbook for each piece (SPA build/deploy, BFF container build/deploy, Drizzle migrations on deploy).
- Admin runbook: user provisioning via `POST /admin/users` (or Supabase dashboard fallback if B4 went the trigger route), role assignment, deactivation, reactivation.
- Backup/restore notes per Supabase's managed offering.
- Post-deploy smoke-test checklist.

**Final gate — MVP launch sign-off.**

Every item in BRD §10 passes:
- All FR requirements implemented and tested.
- Authorization verified: an employee's JWT cannot read or write another user's `time_entries` or `timer_sessions` through the BFF, AND a direct Supabase Postgres connection using that JWT is rejected at the grant level.
- Validation enforced in app layer (Zod + service) and DB layer (constraints).
- Weekly summary correctly groups by ISO week.
- State machine enforces all transitions; invalid transitions rejected with clear errors.
- `amended` distinct from `approved` in UI; `amended_at`, `amended_by`, `original_hours` correct.
- Deactivated users hidden from dropdowns, filters, queues.
- Deactivation workflow atomic (single DB transaction) and followed by admin signOut.
- DELETE on a project/task with references blocked at the DB.
- `timer_sessions.time_entry_id` populated on save, NULL on discard.
- Manager on-behalf-of attribution correct.
- 375px and 1280px render correctly.
- ARIA labels present, keyboard accessible.
- Supabase Auth login, persistence, logout work on supported browsers.
- Cross-device timer state correct on app load.
- Discarded timer creates no `time_entries` row.
- Partial unique index prevents a second active timer at DB level.

Plus:
- Security review (OI-06) signed off.
- UAT signed off.
- Documentation delivered.

---

## 4. Risk register

| # | Risk | Mitigation | Stage |
|---|---|---|---|
| R1 | BFF authorization bug exposes another user's data | Resource-level checks in every service method; integration tests at each gate that hit endpoints with both employee and manager JWTs and verify scoping | 1, all |
| R2 | Grants not properly revoked → frontend JWT can hit DB directly | Test in Stage 1 gate: SELECT from `authenticated` JWT must fail | 1 |
| R3 | Auth hook misconfigured → role missing from JWT or stale after change | Hook tested at Stage 1 gate; role/is_active change refresh-and-reflect test; **B9 ensures `supabase_auth_admin` grants are in the same migration as the function** — missing grants cause a total login outage | 1 |
| R4 | Timer elapsed-time drift across devices | Server-anchored `started_at`; UI ticks from anchor; refresh-based reconciliation on app load | 7 |
| R5 | Unhandled state-machine transition leaves entry unrecoverable | Exhaustive transition tests at Stage 5 gate | 5 |
| R6 | Daily cap miscounts on edit (double-count) | S1 fix; test at Stage 4 gate | 4 |
| R7 | XSS leaks JWT from localStorage | OI-06 review at Stage 9; CSP headers at deploy; 15-min access token TTL bounds blast radius | 9 |
| R8 | Mobile usability gap (375px) discovered late | Test at each stage gate, not only Stage 8 | 2–8 |
| R9 | Cross-device timer expectations exceed MVP scope | OI-07 confirmation at Stage 0 | 0, 7 |
| R10 | Slice boundaries leak (one slice's service imports another's repository for side-effects) | §1.3 acyclic service graph: cross-slice work goes through owning service, not repo; lint errors on cross-slice repo imports; lint warns on undocumented cross-slice service imports | 0, all |
| R11 | Shared types drift between web and api | Single Zod schema source in `@shared-types`; CI typechecks both apps against the package | 0, all |
| R12 | Service-role key leakage from BFF | Key as platform secret; never logged; not in committed env files; rotate post-launch as routine | 0, 9 |
| R13 | Deactivation: DB commit succeeds but admin signOut fails | Log and alert; access token expires within TTL; document accepted residual risk | 4, 9 |
| R14 | Future additions to owning-slice service logic silently bypassed by cross-slice caller | §1.3 rule: cross-slice callers invoke service functions, not repos — all future logic added to those service functions is automatically included; lint enforces the boundary | 0, all |
| R15 | `supabase_auth_admin` permission grants missing from hook migration → total login outage on deploy | B9 closes this before Stage 1; Stage 1 gate queries `information_schema.role_table_grants` to verify grants before hook registration | 1 |
| R16 | `timer_sessions` pending-save vs discarded indistinguishable → users permanently locked out of timer | `status` column (§1.5, B10) discriminates states; `POST /timer/start` blocks on `status IN ('active', 'stopped')` only; Stage 7 gate explicitly tests start after discard succeeds | 1, 7 |

---

## 5. Out of scope for MVP

Per BRD §1.2 and §8:

- Billing integration, payroll export, native mobile apps, multi-tenancy.
- CSV export (OI-02).
- Project / date filters on daily log and weekly summary.
- Soft-delete of entries with audit trail.
- Target hours / utilisation reporting (OI-01).
- Approval notifications via Supabase Edge Functions (OI-03).
- Project archiving (OI-04).
- Realtime cross-device timer sync without refresh (OI-07).

---

## 6. Document control

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 27 May 2026 | Architect | Initial plan against BRD v1.3 |
| 2.0 | 27 May 2026 | Architect | Footgun fixes: (1) in-process domain-event bus for cross-slice encapsulation; (2) `supabase_auth_admin` grants in auth hook migration (B9). BRD adherence: 405 on hard-delete, `manager_note` column verification. |
| 3.0 | 27 May 2026 | Architect | **Replaced event bus with acyclic service orchestration** (§1.3): simpler, explicit, achieves same encapsulation — cross-slice callers invoke owning service functions (not repos), passing `tx`. No registration ceremony, no bootstrap ordering, no tree-shaking concern. **Added `timer_sessions.status` column** (§1.5, B10): `active \| stopped \| saved \| discarded` enum discriminates pending-save from discarded; `POST /timer/start` blocks only on `active/stopped`; deactivation sets `discarded` so reactivated users face no ghost pending-save modal. **Added `UNIQUE (user_id) WHERE status = 'stopped'` index** for DB-level enforcement. **Pure state-machine rule** documented in Stage 5: `shared/state-machine.ts` must be a pure function — no DB queries, no repos, caller provides any needed context. |