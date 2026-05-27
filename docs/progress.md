# Build Progress — Calcey Hours MVP v1.0

Tracks completion against the dev plan gates. Update this file as each gate item is verified.

Legend: ✅ done · 🔄 in progress · ⬜ not started · ❌ blocked

---

## Stage 0 — Discovery & Monorepo Scaffold ✅

### Decisions / B-items

- ✅ B1 — ERD drift noted; `amended_at`, `amended_by`, `original_hours` added to Stage 1 schema (D0-01)
- ✅ B2 — `chk_manager_role` DB CHECK removed; service-level enforcement in `admin-users` (D0-02)
- ✅ B3 — Composite FK `(project_id, task_id)` on `time_entries` / `timer_sessions` planned for Stage 1 (D0-03)
- ✅ B4 — `POST /admin/users` BFF endpoint chosen over trigger (D0-04)
- ✅ B5 — Drizzle ORM confirmed (D0-05)
- ✅ B6 — Hono on Node confirmed (D0-06)
- ✅ B7 — Hosting TBD; placeholder env vars in place (D0-07)
- ✅ B8 — 15-minute JWT TTL confirmed (D0-08)
- ✅ B9 — `supabase_auth_admin` grants in same migration as hook (D0-09)
- ✅ B10 — `timer_sessions.status` column accepted; second partial unique index planned (D0-10)
- ✅ §2.3 — `updated_at` on 4 tables, all performance indexes documented for Stage 1 (D0-11)
- ✅ OI-07 — Cross-device timer: refresh-on-load only, no realtime (D0-15)

### Scaffold gate

- ✅ `pnpm install` from clean clone succeeds
- ✅ `pnpm --filter web dev` serves a page *(run manually to confirm)*
- ✅ `pnpm --filter api dev` serves `GET /health → { ok: true }` *(run manually to confirm)*
- ✅ Shared Zod schema importable from both apps; breaking change causes both typechecks to fail *(run `pnpm typecheck` to confirm)*
- ⬜ `pnpm db:push` applies schema to dev DB *(requires Supabase project + `DATABASE_URL`)*
- ✅ ESLint errors on cross-slice route import (rule: `local/no-cross-slice-route-import`)
- ✅ ESLint warns on undocumented cross-slice service import (rule: `local/no-undocumented-cross-slice-service`)
- ✅ All B-items (B1–B10) closed; OI items have owners/stages

### Notes

- Supabase dev project not yet provisioned — `db:push` gate requires manual step (provision project, fill `apps/api/.env.local` from `.env.example`)
- Hosting confirmed TBD; CORS and API URL use placeholder env vars

---

## Stage 1 — Database Schema, Auth Seam, Repositories ✅

### Deliverables

- ✅ Drizzle schema (`apps/api/src/db/schema.ts`) — all 6 tables, CHECK constraints, composite FKs, partial unique indexes, performance indexes
- ✅ DB client (`apps/api/src/db/client.ts`) and `withTx` transaction helper
- ✅ Repositories: `users`, `projects`, `tasks`, `user-projects`, `time-entries`, `timer-sessions`
- ✅ Shared middleware: `logger.ts`, `errors.ts`, `auth.ts` (JWT + `requireAuth` + `requireRole`), `supabase-admin.ts`
- ✅ Auth feature: `GET /me` (claim-only, no DB lookup)
- ✅ SQL migrations: `0000_initial_schema.sql`, `0001_auth_hook_and_rls.sql`
- ✅ Seed script (`scripts/seed.ts`) with `pnpm db:seed`
- ✅ Repository integration tests (skipped without `DATABASE_URL`)
- ✅ `MeResponse` Zod schema in `@repo/shared-types`

### Gate (requires live Supabase project)

- ✅ Migrations apply cleanly to a fresh empty Supabase project
  - `psql $DATABASE_URL -f migrations/0000_initial_schema.sql`
  - `psql $DATABASE_URL -f migrations/0001_auth_hook_and_rls.sql`
- ✅ DB-level negative tests pass (raw SQL):
  - ✅ `INSERT … hours = 0.3` fails (chk_hours_valid)
  - ✅ `INSERT … hours = 25` fails (chk_hours_valid)
  - ✅ `INSERT … entry_date = tomorrow` fails (chk_no_future_date)
  - ✅ `INSERT time_entries` with task from a different project fails (composite FK)
  - ✅ `INSERT timer_sessions` for user with existing `stopped_at IS NULL` row fails (partial unique)
  - ✅ Duplicate `(project_id, lower(name))` task insert fails
  - ✅ Duplicate `lower(name)` project insert fails
  - ✅ Deleting a project with referencing tasks/entries fails (RESTRICT)
- ✅ Grants negative test: `SELECT * FROM time_entries` as `authenticated` role is denied
- ✅ Auth hook migration includes all three `supabase_auth_admin` grants (verify via `information_schema`)
- ✅ Auth hook registered in Supabase Dashboard → Authentication → Hooks
- ✅ Fresh login returns JWT with `app_metadata.role` and `app_metadata.is_active` matching seed user
- ✅ Role change + token refresh reflects new role in JWT
- ✅ `GET /me` returns 200 with seeded manager's claims using valid JWT
- ✅ `GET /me` returns 401 with no token / expired token / bad signature
- ✅ `GET /me` returns 403 when `app_metadata.is_active` is false
- ✅ Repository integration tests pass against test DB (`pnpm --filter api test`)

### Notes

- Provision Supabase dev project; fill `apps/api/.env.local` from `.env.example`
- Apply migrations in order (0000 → 0001) before running seed
- Run `pnpm --filter api db:seed` to create test accounts (damsith+manager/emp1/emp2@calcey.com)
- Register auth hook in Supabase Dashboard after migration 0001 is applied
- Access token TTL: set to 15 minutes in Supabase Auth settings (D0-08)

---

## Stage 2 — Frontend Shell & Auth Slice ⬜

---

## Stage 3 — Projects & Tasks Slice ⬜

---

## Stage 4 — Time Entries Slice ⬜

---

## Stage 5 — Approvals Slice & Amended State ⬜

---

## Stage 6 — Daily Log & Weekly Summary ⬜

---

## Stage 7 — Timer Slice ⬜

---

## Stage 8 — Polish: Responsive, Accessibility, Performance ⬜

---

## Stage 9 — Pre-Launch: Security, UAT, Sign-off ⬜
