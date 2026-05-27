# Design Decisions Log — Calcey Hours

Tracks every architectural and design decision made during development. Updated as stages complete.

---

## Stage 1 — Database Schema, Auth Seam, Repositories

### D1-01 · Auth hook injects `full_name` into JWT

**Decision:** The `custom_access_token_hook` also injects `app_metadata.full_name` alongside `role` and `is_active`.

**Why:** The frontend `AuthProvider` needs the user's display name from `/me` without a DB round-trip. Adding `full_name` to the hook at Stage 1 avoids a schema migration later and keeps `/me` claim-only per the dev plan.

---

### D1-02 · JWKS lazily initialized in auth middleware

**Decision:** `createRemoteJWKSet` is called lazily (on first request) rather than at module load time.

**Why:** Module-load initialization would throw if `SUPABASE_URL` is missing at server start-time, breaking `pnpm --filter api dev` before env vars are configured. Lazy init lets the server start, with auth errors deferred to actual requests.

---

### D1-03 · Migration files committed as plain SQL (not Drizzle-journal format)

**Decision:** `migrations/0000_initial_schema.sql` and `migrations/0001_auth_hook_and_rls.sql` are hand-written SQL files. They are applied via the `psql` CLI (`psql $DATABASE_URL -f ...`) or the Supabase SQL editor. `db:push` is used for local dev (no migration tracking). Running `pnpm db:generate` after connecting to a live DB will produce the Drizzle-journal format in the same directory for production `db:migrate` use.

**Why:** `drizzle-kit generate` needs a live DB connection only when the old snapshot differs. For Stage 1 (no prior schema), the SQL content is well-known. Committing the SQL directly means the repo is self-documenting even before Supabase is provisioned. The Drizzle snapshot files can be generated once connected.

---

### D1-04 · `drizzle.config.ts` allows empty DATABASE_URL for `db:generate`

**Decision:** The config no longer throws on missing `DATABASE_URL`. An empty string is passed to `dbCredentials.url`; `db:generate` succeeds without a connection. `db:push` and `db:migrate` fail at connection time with a clear postgres error.

**Why:** The original `throw` prevented `pnpm db:generate` from running without env vars, which blocked schema iteration in environments without a provisioned DB.

---

## Stage 2 — Frontend Shell & Auth Slice

### D2-01 · `AuthProvider` exposes `meError` for inactive-account handling

**Decision:** The auth context includes a `meError: Error | null` field in addition to `user`, `session`, and `isLoading`. `RequireAuth` reads `meError` and renders a dedicated "Account deactivated" screen when it is an `ApiError` with status 403.

**Why:** The BFF returns 403 when `app_metadata.is_active = false` on a JWT that is otherwise valid. Without surfacing the error, a deactivated user would see an infinite loading state or an unexplained redirect loop. The deactivated screen gives a clear message and a sign-out button.

---

### D2-02 · Mobile nav uses a left-side drawer, not a bottom tab bar

**Decision:** On screens narrower than 768px, navigation is a slide-in drawer triggered by a hamburger button in the top bar. The mobile design files show a bottom tab bar (iOS-style), but dev plan §3/Stage 2 explicitly specifies "drawer nav under 768px."

**Why:** Dev plan takes priority over design files per CLAUDE.md. A drawer also keeps a single navigation component (`Sidebar`) reused across desktop and mobile, rather than maintaining a separate tab-bar component with different navigation semantics.

---

### D2-03 · Route `/app/team` for admin-users slice

**Decision:** The manager-only team management route is `/app/team` (matching the design IA) rather than `/app/admin` (the BFF slice name). The BFF feature slice remains named `admin-users`.

**Why:** The design handoff README uses "Team" as the nav label with path `/app/team`. Keeping the URL user-facing name consistent with the nav label avoids confusion. The BFF slice name is an implementation detail invisible to users.

---

### D2-04 · HTTP client fetches a fresh session token on every request

**Decision:** `apps/web/src/shared/http.ts` calls `supabase.auth.getSession()` before each request to get the current access token rather than storing the token in module state.

**Why:** The Supabase client handles silent token refresh internally. Calling `getSession()` always returns the current (post-refresh) token. Storing the token would require subscribing to `onAuthStateChange` and keeping module state in sync — unnecessary complexity for an MVP where request frequency is low.

---

## Stage 0 — Discovery & Monorepo Scaffold

### D0-01 · B1: ERD drift — `amended_at`, `amended_by`, `original_hours` columns

**Decision:** ERD v1.2 is not updated (no tooling to regenerate it automatically). The three missing columns on `time_entries` are explicitly added in the Stage 1 Drizzle schema and documented here. The BRD v1.3 §5.2 description is authoritative; the ERD is a visualisation aide only.

**Why:** Regenerating the ERD requires the original tooling (unavailable). The Drizzle schema is the single source of truth for the actual DB structure. The ERD will be regenerated from the schema after Stage 1 migrations are finalised.

---

### D0-02 · B2: Remove `chk_manager_role` DB CHECK constraint

**Decision:** No `CHECK` constraint on `users.manager_id` referencing the target's `role`. Enforcement is in `admin-users/service.ts`:
- On `manager_id` assignment: service validates target row has `role = 'manager'`.
- On role change from `manager → employee`: service blocks if any users still reference this person as their manager.

**Why:** PostgreSQL `CHECK` constraints don't re-evaluate when referenced rows change. Demoting a manager would silently leave dangling `manager_id` references. Service-layer enforcement runs on every mutation and can query current state.

---

### D0-03 · B3: Composite FK for task–project consistency

**Decision:** Stage 1 adds `UNIQUE (id, project_id)` on `tasks`. Both `time_entries.task_id` and `timer_sessions.task_id` use composite FKs `(project_id, task_id) → tasks(project_id, id)` instead of simple FK on `task_id` alone.

**Why:** A simple FK on `task_id` allows inserting a time entry where `project_id = A` but `task_id` belongs to project B. The composite FK makes this impossible at the DB level. Service also validates, but DB constraint is cheap defence-in-depth.

---

### D0-04 · B4: `auth.users → public.users` sync — BFF endpoint chosen

**Decision:** User provisioning uses `POST /admin/users` on the BFF (manager-only). The endpoint calls the Supabase admin API to create the Auth user, then inserts the `public.users` row. If the DB insert fails, the Auth user is deleted (compensating action). No trigger on `auth.users`.

**Why:** A trigger on `auth.users` runs with `supabase_auth_admin` privileges and has limited ability to rollback cleanly if the `public.users` insert fails. The BFF endpoint gives full control: explicit rollback, proper error messages to the caller, and keeps the provisioning logic in application code where it's observable and testable.

---

### D0-05 · B5: Drizzle ORM confirmed

**Decision:** Drizzle ORM with `postgres` (porsager driver) for all database access.

**Why:** Drizzle gives TypeScript-first query building, SQL-close mental model, and Drizzle Kit for migration management. The alternative (Kysely) is equally capable but Drizzle's schema-as-code approach fits the codebase style better. Decision confirmed per dev plan §1.1.

---

### D0-06 · B6: Hono on Node confirmed

**Decision:** Hono running via `@hono/node-server`. Dev server uses `tsx watch`. Production build compiles to `dist/` and runs with `node`.

**Why:** Hono is lightweight, TypeScript-native, and has a great middleware model. `@hono/node-server` makes the local dev setup straightforward. Confirmed per dev plan §1.1.

---

### D0-07 · B7: Hosting TBD

**Decision:** Hosting targets deferred to Stage 9 (pre-launch). CORS origin and BFF public URL use placeholder env vars (`CORS_ORIGIN`, `VITE_API_URL`).

**Why:** No business requirement for a specific provider at this stage. Picking a provider now just adds config overhead before any code is deployed. Stage 9 will confirm: SPA host (Vercel/Netlify/Cloudflare Pages), BFF host (Fly.io/Railway/Render), and region.

---

### D0-08 · B8: JWT access token TTL — 15 minutes

**Decision:** Supabase Auth access token TTL set to 15 minutes.

**Why:** 15 minutes bounds the staleness window for `role` and `is_active` JWT claims without causing excessive silent-refresh cycles for users. On deactivation, the admin `signOut` call invalidates refresh tokens; the deactivated user has at most 15 minutes of residual access. This trade-off is accepted and documented. Stakeholders confirmed no stricter requirement.

---

### D0-09 · B9: `supabase_auth_admin` grants in the same migration as the hook function

**Decision:** The auth hook migration (Stage 1) must include all three grants in one migration file:
1. `GRANT USAGE ON SCHEMA public TO supabase_auth_admin`
2. `GRANT SELECT ON TABLE public.users TO supabase_auth_admin`
3. `GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin`

Stage 1 gate explicitly verifies these grants via `information_schema.role_table_grants` before registering the hook in the Supabase dashboard.

**Why:** `supabase_auth_admin` has no access to `public` schema by default. Missing any of these three grants causes an unhandled DB error on every token issuance, producing a total login outage. Separating them into a follow-up migration creates a window where the hook is registered but non-functional. Combining them eliminates the risk entirely.

---

### D0-10 · B10: `timer_sessions.status` column accepted

**Decision:** A `status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stopped', 'saved', 'discarded'))` column is added to `timer_sessions`. This is an implementation-level addition not in BRD v1.3 §5.2 but required to safely implement FR-41, FR-48, FR-49.

**Why:** Without a status discriminator, `stopped` (awaiting user save decision) and `discarded` (terminal) share identical column values (`stopped_at IS NOT NULL, time_entry_id IS NULL`). The `POST /timer/start` guard cannot distinguish them, permanently locking out users who discard a session. See dev plan §1.5 for full analysis. BRD author notified; behavioural requirements are unchanged.

**Additional index:** `UNIQUE (user_id) WHERE status = 'stopped'` enforces at DB level that a user can have at most one pending-save session.

---

### D0-11 · B10 / §2.3: `updated_at` columns added to four tables

**Decision:** `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` added to `time_entries`, `projects`, `tasks`, `users`. A single shared `updated_at` trigger function is applied to all four tables.

**Why:** BRD §5.3 says "apply the same pattern" without being explicit. Without `updated_at` on `projects`, `tasks`, and `users`, optimistic concurrency checks and cache invalidation have no reliable staleness signal. Adding a shared trigger function is one-time cost with ongoing benefit.

---

### D0-12 · Monorepo package naming convention

**Decision:** Shared packages use the `@repo/` scope: `@repo/shared-types`, `@repo/tsconfig`, `@repo/eslint-config`.

**Why:** Avoids conflicts with npm public packages, clearly signals internal-only packages, consistent with Turborepo starter conventions. The scope name `@repo` is a widely adopted monorepo convention.

---

### D0-13 · ESLint cross-slice enforcement via local plugin

**Decision:** A small local ESLint plugin (`apps/api/eslint-local.mjs`) implements two custom rules:
- `local/no-cross-slice-route-import` (error): any `features/X` file importing `features/Y/routes*`.
- `local/no-undocumented-cross-slice-service` (warn): any `features/X` file importing `features/Y/service*`.

**Why:** `no-restricted-imports` cannot produce different severities for different patterns in the same rule instance. A tiny local plugin (≈60 lines) solves this cleanly without an external dependency. The two-severity approach mirrors the dev plan's intent: route imports are always wrong; service imports require justification but are legal for the declared dependency graph.

---

### D0-14 · Tailwind v4 with `@theme` for design token mapping

**Decision:** Tailwind CSS v4 with `@tailwindcss/vite` plugin. Design tokens from `design_handoff_calcey_hours/design/design_system/colors_and_type.css` are re-declared in `apps/web/src/index.css` under `@theme` so they are available as Tailwind utility classes (`bg-tropical-magenta`, `text-ink-1000`, etc.).

**Why:** Tailwind v4 uses CSS-first configuration (`@theme` block) instead of `tailwind.config.js`. This keeps the token source close to usage and avoids duplicating the design system in a separate config file. The `@tailwindcss/vite` plugin integrates with Vite's transform pipeline with no PostCSS config needed.

---

### D0-15 · OI items — owners and target stages

| Item | Description | Owner | Target |
|---|---|---|---|
| OI-01 | Target hours / utilisation reporting | Post-MVP | Out of scope |
| OI-02 | CSV export | Post-MVP | Out of scope |
| OI-03 | Approval notifications (Edge Functions) | Post-MVP | Out of scope |
| OI-04 | Project archiving | Post-MVP | Out of scope |
| OI-05 | — | — | — |
| OI-06 | JWT in localStorage — threat model | Stage 9 | Pre-launch security review |
| OI-07 | Cross-device timer sync (refresh-only) | Stage 0 ✅ confirmed | Refresh-on-load only; no realtime subscription |

---
