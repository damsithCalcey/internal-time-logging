-- ============================================================
-- Migration 0000 — Initial schema
-- Apply with: psql $DATABASE_URL -f migrations/0000_initial_schema.sql
-- ============================================================

-- Enums
CREATE TYPE "public"."user_role" AS ENUM ('manager', 'employee');
CREATE TYPE "public"."time_entry_status" AS ENUM (
  'draft', 'submitted', 'approved', 'rejected', 'amended'
);
CREATE TYPE "public"."timer_session_status" AS ENUM (
  'active', 'stopped', 'saved', 'discarded'
);

-- Users
-- Note: id is set by the application to match auth.users.id (no defaultRandom).
CREATE TABLE "public"."users" (
  "id"         uuid        NOT NULL,
  "email"      text        NOT NULL,
  "full_name"  text        NOT NULL,
  "role"       "public"."user_role" NOT NULL DEFAULT 'employee',
  "manager_id" uuid,
  "is_active"  boolean     NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "users_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "users_email_unique"  UNIQUE ("email"),
  CONSTRAINT "users_manager_fk"    FOREIGN KEY ("manager_id")
    REFERENCES "public"."users" ("id") ON DELETE RESTRICT
);

-- Projects
CREATE TABLE "public"."projects" (
  "id"          uuid        NOT NULL DEFAULT gen_random_uuid(),
  "name"        text        NOT NULL,
  "description" text,
  "created_by"  uuid        NOT NULL,
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  "updated_at"  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "projects_pkey"       PRIMARY KEY ("id"),
  CONSTRAINT "projects_created_by_fk" FOREIGN KEY ("created_by")
    REFERENCES "public"."users" ("id") ON DELETE RESTRICT
);

-- Case-insensitive unique project name (B2, §2.3)
CREATE UNIQUE INDEX "projects_name_lower_unique"
  ON "public"."projects" (lower("name"));

-- Tasks
CREATE TABLE "public"."tasks" (
  "id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
  "project_id" uuid        NOT NULL,
  "name"       text        NOT NULL,
  "is_active"  boolean     NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "tasks_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "tasks_project_fk"    FOREIGN KEY ("project_id")
    REFERENCES "public"."projects" ("id") ON DELETE RESTRICT,
  -- Composite unique enables composite FK from time_entries / timer_sessions (D0-03)
  CONSTRAINT "tasks_id_project_unique" UNIQUE ("id", "project_id")
);

-- Case-insensitive unique task name within project (§2.3)
CREATE UNIQUE INDEX "tasks_project_name_lower_unique"
  ON "public"."tasks" ("project_id", lower("name"));

CREATE INDEX "tasks_project_idx" ON "public"."tasks" ("project_id");

-- User-project assignments
CREATE TABLE "public"."user_projects" (
  "user_id"     uuid        NOT NULL,
  "project_id"  uuid        NOT NULL,
  "assigned_by" uuid        NOT NULL,
  "assigned_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "user_projects_pkey"         PRIMARY KEY ("user_id", "project_id"),
  CONSTRAINT "user_projects_user_fk"      FOREIGN KEY ("user_id")
    REFERENCES "public"."users" ("id") ON DELETE RESTRICT,
  CONSTRAINT "user_projects_project_fk"   FOREIGN KEY ("project_id")
    REFERENCES "public"."projects" ("id") ON DELETE RESTRICT,
  CONSTRAINT "user_projects_assigned_by_fk" FOREIGN KEY ("assigned_by")
    REFERENCES "public"."users" ("id") ON DELETE RESTRICT
);

CREATE INDEX "user_projects_project_idx" ON "public"."user_projects" ("project_id");

-- Time entries
CREATE TABLE "public"."time_entries" (
  "id"             uuid        NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        uuid        NOT NULL,
  "project_id"     uuid        NOT NULL,
  "task_id"        uuid        NOT NULL,
  "entry_date"     date        NOT NULL,
  "hours"          numeric(4,1) NOT NULL,
  "notes"          text,
  "status"         "public"."time_entry_status" NOT NULL DEFAULT 'draft',
  "manager_note"   text,
  "amended_at"     timestamptz,
  "amended_by"     uuid,
  "original_hours" numeric(4,1),
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  "updated_at"     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "time_entries_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "time_entries_user_fk"      FOREIGN KEY ("user_id")
    REFERENCES "public"."users" ("id") ON DELETE RESTRICT,
  -- Composite FK: task must belong to the stated project (D0-03)
  CONSTRAINT "time_entries_project_task_fk" FOREIGN KEY ("project_id", "task_id")
    REFERENCES "public"."tasks" ("project_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "time_entries_amended_by_fk" FOREIGN KEY ("amended_by")
    REFERENCES "public"."users" ("id") ON DELETE RESTRICT,
  -- hours must be positive, ≤ 24, and in 0.5 increments (BRD §6.3)
  CONSTRAINT "chk_hours_valid" CHECK (
    hours > 0 AND hours <= 24 AND FLOOR(hours * 2) = hours * 2
  ),
  -- No future-dated entries (BRD §6.3)
  CONSTRAINT "chk_no_future_date" CHECK (entry_date <= CURRENT_DATE)
);

-- Performance indexes (§2.3)
CREATE INDEX "time_entries_user_date_idx"    ON "public"."time_entries" ("user_id", "entry_date" DESC);
CREATE INDEX "time_entries_status_idx"       ON "public"."time_entries" ("status");
CREATE INDEX "time_entries_project_date_idx" ON "public"."time_entries" ("project_id", "entry_date");

-- Timer sessions
CREATE TABLE "public"."timer_sessions" (
  "id"            uuid        NOT NULL DEFAULT gen_random_uuid(),
  "user_id"       uuid        NOT NULL,
  "project_id"    uuid        NOT NULL,
  "task_id"       uuid        NOT NULL,
  "started_at"    timestamptz NOT NULL DEFAULT now(),
  "stopped_at"    timestamptz,
  -- Discriminates pending-save ('stopped') from terminal states (§1.5, D0-10)
  "status"        "public"."timer_session_status" NOT NULL DEFAULT 'active',
  "time_entry_id" uuid,
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "timer_sessions_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "timer_sessions_user_fk"      FOREIGN KEY ("user_id")
    REFERENCES "public"."users" ("id") ON DELETE RESTRICT,
  -- Composite FK: task must belong to the stated project (D0-03)
  CONSTRAINT "timer_sessions_project_task_fk" FOREIGN KEY ("project_id", "task_id")
    REFERENCES "public"."tasks" ("project_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "timer_sessions_entry_fk"     FOREIGN KEY ("time_entry_id")
    REFERENCES "public"."time_entries" ("id") ON DELETE RESTRICT
);

-- One active timer per user at the DB level (BRD §5.3)
CREATE UNIQUE INDEX "timer_active_per_user"
  ON "public"."timer_sessions" ("user_id")
  WHERE stopped_at IS NULL;

-- One pending-save session per user at the DB level (§1.5, D0-10)
CREATE UNIQUE INDEX "timer_stopped_per_user"
  ON "public"."timer_sessions" ("user_id")
  WHERE status = 'stopped';
