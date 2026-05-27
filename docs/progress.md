# Build Progress — Calcey Hours MVP v1.0

Tracks completion against the dev plan gates. Update this file as each gate item is verified.

Legend: ✅ done · 🔄 in progress · ⬜ not started · ❌ blocked

---

## Stage 0 — Discovery & Monorepo Scaffold 🔄

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

## Stage 1 — Database Schema, Auth Seam, Repositories ⬜

*(begin after Stage 0 gate fully passes)*

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
