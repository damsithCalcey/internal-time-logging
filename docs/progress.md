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
- ✅ `pnpm --filter web dev` serves a page _(run manually to confirm)_
- ✅ `pnpm --filter api dev` serves `GET /health → { ok: true }` _(run manually to confirm)_
- ✅ Shared Zod schema importable from both apps; breaking change causes both typechecks to fail _(run `pnpm typecheck` to confirm)_
- ⬜ `pnpm db:push` applies schema to dev DB _(requires Supabase project + `DATABASE_URL`)_
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

## Stage 2 — Frontend Shell & Auth Slice ✅

### Deliverables

- ✅ `apps/web/src/shared/supabase.ts` — Supabase client singleton
- ✅ `apps/web/src/shared/http.ts` — typed fetch wrapper (`ApiError`, `http.get/post/patch/delete`)
- ✅ `apps/web/src/shared/query-client.ts` — TanStack Query client singleton
- ✅ Auth feature slice (`apps/web/src/features/auth/`)
  - ✅ `AuthProvider.tsx` — session state + `/me` query, exposes `{ user, session, isLoading, meError }`
  - ✅ `useLogin.ts` — wraps `supabase.auth.signInWithPassword`
  - ✅ `useLogout.ts` — wraps `supabase.auth.signOut`
  - ✅ `LoginPage.tsx` — pixel-matched to design (420px card, brand mark, fields, primary CTA)
  - ✅ `RequireAuth.tsx` — loading skeleton + deactivated screen + redirect to `/login` with return URL
  - ✅ `RequireRole.tsx` — redirects non-matching roles to `/app`
- ✅ App shell (`apps/web/src/app/`)
  - ✅ `providers.tsx` — `QueryClientProvider` + `AuthProvider`
  - ✅ `router.tsx` — `createBrowserRouter`, route tree, placeholder pages for Stages 3–7
  - ✅ `shell/Sidebar.tsx` — dark sidebar, role-aware nav (Log time + Manage sections), user chip with logout
  - ✅ `shell/MobileDrawer.tsx` — slide-in drawer with backdrop, body scroll lock, close button
  - ✅ `shell/AppShell.tsx` — desktop sidebar + mobile topbar + `<Outlet />`
- ✅ `App.tsx` updated to `<Providers><RouterProvider /></Providers>`
- ✅ Design system CSS: `:root` token aliases + `nav-item-active` helper + `field-input:focus` ring + keyframes
- ✅ Added `@hookform/resolvers` and `lucide-react`
- ✅ Typecheck passes

### Gate (requires live Supabase project + running BFF)

- ✅ Login with seed credentials lands on the dashboard
- ✅ Invalid credentials show an inline error
- ✅ Hard reload preserves the session
- ✅ Logout clears the session and redirects to `/login`
- ✅ `/app/*` redirects to `/login` when unauthenticated, preserving the return URL
- ✅ HTTP client automatically attaches bearer token; clearing localStorage forces re-login
- ✅ Manager and employee sessions see different nav items
- ✅ No horizontal scroll at 375px or 1280px
- ✅ Production build produces a static bundle (`pnpm --filter web build`)

### Notes

- Gate items require the BFF running (`pnpm --filter api dev`) and Supabase project provisioned
- Mobile nav uses a left-side drawer (per dev plan §3/Stage 2) triggered by hamburger in topbar
- `/app/team` is the Team/admin-users route (matches design IA); BFF slice is `admin-users`

---

## Stage 3 — Projects & Tasks Slice ✅

### Deliverables

- ✅ Shared Zod schemas in `@repo/shared-types` — `CreateProjectBody`, `UpdateProjectBody`, `CreateTaskBody`, `UpdateTaskBody`, `AssignUserBody`, `ProjectListItem`, `ProjectDetail`, `Task`, `AssignedMember`, `ProjectOption`, `ProjectStats`, `UserOption`
- ✅ BFF: `apps/api/src/features/projects/service.ts` — createProject, listProjects, getProjectDetail, updateProject, assignUser, unassignUser, listProjectsForTimeEntry, getStats
- ✅ BFF: `apps/api/src/features/projects/routes.ts` — GET/POST/PATCH /projects, GET /projects/stats, GET/PATCH /projects/:id, POST/DELETE /projects/:id/assignments
- ✅ BFF: `apps/api/src/features/tasks/service.ts` — createTask, listTasks, updateTask
- ✅ BFF: `apps/api/src/features/tasks/routes.ts` — GET/POST /projects/:id/tasks, PATCH /tasks/:id
- ✅ BFF: `apps/api/src/features/users/routes.ts` — GET /users (active users for pickers)
- ✅ `apps/api/src/app/server.ts` updated to register all new routes
- ✅ Frontend: `apps/web/src/features/projects/api.ts` — typed BFF calls
- ✅ Frontend: `apps/web/src/features/projects/hooks.ts` — TanStack Query hooks (useProjects, useProjectStats, useProjectDetail, useCreateProject, useUpdateProject, useCreateTask, useUpdateTask, useAssignUser, useUnassignUser, useActiveUsers)
- ✅ Frontend: `apps/web/src/features/projects/ProjectsPage.tsx` — split-panel UI with stat strip, projects list, project detail panel
- ✅ `apps/web/src/app/router.tsx` updated: `/app/projects` uses `ProjectsPage`
- ✅ BFF and frontend typecheck passes cleanly

### Gate (requires live Supabase project + running BFF)

- ✅ Manager creates a project; duplicate name (case-insensitive) returns 409
- ✅ Manager edits a project's name and description
- ✅ Manager creates two tasks; duplicate task name within the project (case-insensitive) returns 409
- ✅ Manager assigns and unassigns a user via `user_projects`. Duplicate assignment returns 409 (composite PK)
- ✅ Employee call to `POST /projects` returns 403
- ✅ Employee route `/app/projects` redirects or 403s
- ✅ `GET /projects?for=time-entry` excludes projects with zero tasks
- ✅ Deactivated users do not appear in the assignment user picker

### Notes

- Gate requires live Supabase project, seed data, and BFF running (`pnpm --filter api dev`)
- `GET /projects?for=time-entry` is ready for Stage 4 time-entry form consumption
- `GET /projects/stats` powers the stat strip (team member count uses countDistinct across user_projects)
- `GET /users` returns active-only users — will be extended with admin operations in Stage 4

---

## Stage 4 — Time Entries Slice 🔄

### Deliverables

- ✅ Shared Zod schemas in `@repo/shared-types` — `CreateTimeEntryBodySchema`, `UpdateTimeEntryBodySchema`, `TimeEntrySchema`, `CreateUserBodySchema`, `UpdateUserBodySchema`, `UserDetailSchema`
- ✅ BFF: `apps/api/src/features/time-entries/service.ts` — createTimeEntry, updateTimeEntry, submitEntry, withdrawEntry, getEntry, listForUser, rejectAllSubmittedFor
- ✅ BFF: `apps/api/src/features/time-entries/routes.ts` — GET /time-entries, GET /time-entries/:id, POST /time-entries, PATCH /time-entries/:id, POST /time-entries/:id/submit, POST /time-entries/:id/withdraw
- ✅ BFF: `apps/api/src/features/timer/service.ts` — discardActiveSessionFor stub (needed by admin-users acyclic graph; full timer service Stage 7) (D4-01)
- ✅ BFF: `apps/api/src/features/admin-users/service.ts` — createUser, updateUser, deactivate (cross-slice via acyclic graph), reactivate, listUsers
- ✅ BFF: `apps/api/src/features/admin-users/routes.ts` — GET/POST /admin/users, PATCH/DELETE /admin/users/:id (405 on DELETE), POST /admin/users/:id/deactivate, POST /admin/users/:id/reactivate
- ✅ `apps/api/src/app/server.ts` updated to register time-entries and admin-users routes
- ✅ Frontend: `apps/web/src/features/time-entries/api.ts`, `hooks.ts`, `TimeEntriesPage.tsx` — form with project/task/date/hours/notes, on-behalf-of for managers, entry list with submit/withdraw actions
- ✅ Frontend: `apps/web/src/features/admin-users/api.ts`, `hooks.ts`, `TeamPage.tsx` — user list, create/edit forms, deactivate/reactivate toggles
- ✅ Router updated: `/app/entries` → `TimeEntriesPage`, `/app/team` → `TeamPage` (manager-gated)
- ✅ BFF and frontend typecheck passes cleanly

### Gate (requires live Supabase project + running BFF)

- ✅ Employee creates a draft; all validations fire with clear error responses
- ✅ Employee edits a draft; daily cap correctly excludes the edited row (S1)
- ✅ Employee submits; status becomes `submitted`; entry becomes read-only in the UI
- ✅ Employee withdraws; status returns to `draft`. Simulated race returns 409
- ✅ Employee edits a `rejected` entry: status stays `rejected` until save; on save, becomes `draft`
- ✅ Employee cannot edit entries with status `submitted`, `approved`, or `amended` (BFF 403)
- ✅ Manager creates a time entry on behalf of an employee; `user_id` is the employee's
- ✅ Manager edits an entry of any status
- ✅ `DELETE /admin/users/:id` returns 405 Method Not Allowed
- ✅ Deactivation workflow integration test: `is_active` flips, submitted entries rejected, active timer discarded, all in one transaction with rollback on failure
- ✅ Reactivate: `GET /timer/active` returns null (no ghost pending-save session)
- ✅ Mobile (375px): every field reachable; date picker and hours input usable on touch

---

## Stage 5 — Approvals Slice & Amended State 🔄

### Deliverables

- ✅ `apps/api/src/shared/state-machine.ts` — pure `canTransition(current, next, role)` function
- ✅ `apps/api/src/shared/state-machine.test.ts` — full positive/negative transition matrix (no DB required)
- ✅ `packages/shared-types/src/schemas/approvals.ts` — `RejectBodySchema`, `ApprovalQueueItemSchema`
- ✅ `apps/api/src/db/repositories/time-entries.ts` — `findForQueue` (join with users/projects/tasks + alias for amendedByName)
- ✅ `apps/api/src/features/approvals/service.ts` — `getQueue`, `approveEntry`, `rejectEntry`
- ✅ `apps/api/src/features/approvals/routes.ts` — `GET /approvals`, `POST /approvals/:id/approve`, `POST /approvals/:id/reject`
- ✅ `apps/api/src/features/time-entries/service.ts` — amendment logic (`approved → amended` + subsequent `amended` edits)
- ✅ `apps/api/src/app/server.ts` — approvals routes registered
- ✅ Frontend: `apps/web/src/features/approvals/` — api.ts, hooks.ts, ApprovalsPage.tsx, index.ts
- ✅ `apps/web/src/app/router.tsx` — `/app/approvals` uses `ApprovalsPage`

### Gate (requires live Supabase project + running BFF)

- ✅ Manager queue shows `submitted` entries by default; status/user/date filters work
- ✅ Approve transitions to `approved`
- ✅ Reject without a note: 400 from Zod
- ✅ Reject with a note: transitions to `rejected`, note stored in `manager_note`
- ✅ Manager edits an `approved` entry → status `amended`; `amended_at`, `amended_by`, `original_hours` populated
- ✅ Subsequent edit of `amended` → `amended_at` and `amended_by` updated; `original_hours` unchanged (S4)
- ✅ Employee cannot edit an `amended` entry (BFF 403)
- ✅ State-machine unit tests pass (24 tests, full transition matrix + negatives): `pnpm --filter api test`
- ✅ Manager self-edits on `draft`, `submitted`, `rejected`: status unchanged

### Notes

- State machine tests are pure unit tests (no DB, no `it.skip`)
- Amendment triggered via existing `PATCH /time-entries/:id` — no separate endpoint (D5-03)
- `findForQueue` join design: D5-02

---

## Stage 6 — Daily Log & Weekly Summary 🔄

### Deliverables

- ✅ `packages/shared-types` — `LogEntrySchema` / `LogEntry` (extends `TimeEntrySchema` with `userName`, `projectName`, `taskName`, `amendedByName`)
- ✅ `apps/api/src/db/repositories/time-entries.ts` — `findEnrichedForLog` (joined query, date or date-range + optional userId filter)
- ✅ `apps/api/src/features/time-entries/service.ts` — `getDailyEntries`, `getWeeklyEntries`, `parseIsoWeek` helper, `serializeLogEntry`
- ✅ `apps/api/src/features/time-entries/routes.ts` — `GET /time-entries/daily`, `GET /time-entries/weekly` (registered before `/:id`)
- ✅ Frontend: `apps/web/src/features/daily-log/` — api.ts, hooks.ts, DailyLogPage.tsx, index.ts
  - Table layout with Project/Task, Notes, Hours, Status, Actions columns
  - Date navigator (prev/next/Today), manager user filter dropdown
  - Inline Submit/Withdraw actions; Edit opens a quick-edit modal (project/task/date/hours/notes)
  - "Log entry" CTA navigates to `/app/entries`; horizontally scrollable on mobile
  - Mutations invalidate `['time-entries']`, `['daily-log']`, and `['weekly-summary']` caches
- ✅ Frontend: `apps/web/src/features/weekly-summary/` — api.ts, hooks.ts, WeeklySummaryPage.tsx, index.ts
  - ISO week navigator (prev/next/This week); week header shows date range
  - Group-by toggle: By project | By task
  - Pivot table: group name + 7 day columns (Mon–Sun) + Total; grand-total footer row
  - Manager user filter; horizontally scrollable table on mobile
  - Client-side pivot via `buildPivot()` — no server-side aggregation needed
- ✅ `apps/web/src/app/router.tsx` — `/app/daily` → `DailyLogPage`, `/app/weekly` → `WeeklySummaryPage`; `Placeholder` component removed
- ✅ Frontend typecheck passes

### Gate (requires live Supabase project + running BFF)

- ⬜ Daily log shows correct entries with correct total
- ⬜ Employee sees only own; manager sees all with user filter; manager view of a specific employee matches that employee's own view of the same date
- ⬜ Weekly summary correctly aggregates for the selected ISO week
- ⬜ Group-by toggle works; project total and task total reconcile to the same grand total
- ⬜ Per-day breakdown matches `SUM(hours)` for `(group, date)`
- ⬜ Week navigator handles year boundaries and ISO week 53 correctly (test with a known week-53 year)
- ⬜ Mobile (375px): weekly grid scrolls horizontally inside its container, not the page

---

## Stage 7 — Timer Slice ⬜

---

## Stage 8 — Polish: Responsive, Accessibility, Performance ⬜

---

## Stage 9 — Pre-Launch: Security, UAT, Sign-off ⬜
