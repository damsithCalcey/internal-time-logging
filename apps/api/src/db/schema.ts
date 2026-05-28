import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['manager', 'employee'])
export const timeEntryStatusEnum = pgEnum('time_entry_status', [
  'draft',
  'submitted',
  'approved',
  'rejected',
  'amended',
])
export const timerSessionStatusEnum = pgEnum('timer_session_status', [
  'active',
  'stopped',
  'saved',
  'discarded',
])

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull().unique(),
    fullName: text('full_name').notNull(),
    role: userRoleEnum('role').notNull().default('employee'),
    managerId: uuid('manager_id'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.managerId],
      foreignColumns: [table.id],
      name: 'users_manager_fk',
    }).onDelete('restrict'),
  ],
)

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('projects_name_lower_unique').on(sql`lower(${table.name})`)],
)

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Composite unique enables the composite FK from time_entries and timer_sessions
    unique('tasks_id_project_unique').on(table.projectId, table.id),
    index('tasks_project_idx').on(table.projectId),
  ],
)

export const userProjects = pgTable(
  'user_projects',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict' }),
    assignedBy: uuid('assigned_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.projectId] }),
    index('user_projects_project_idx').on(table.projectId),
  ],
)

export const timeEntries = pgTable(
  'time_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    taskId: uuid('task_id').notNull(),
    entryDate: date('entry_date').notNull(),
    hours: numeric('hours', { precision: 4, scale: 1 }).notNull(),
    notes: text('notes'),
    status: timeEntryStatusEnum('status').notNull().default('draft'),
    managerNote: text('manager_note'),
    amendedAt: timestamp('amended_at', { withTimezone: true }),
    amendedBy: uuid('amended_by').references(() => users.id, { onDelete: 'restrict' }),
    originalHours: numeric('original_hours', { precision: 4, scale: 1 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Composite FK ensures task belongs to the stated project (D0-03)
    foreignKey({
      columns: [table.projectId, table.taskId],
      foreignColumns: [tasks.projectId, tasks.id],
      name: 'time_entries_project_task_fk',
    }).onDelete('restrict'),
    check('chk_hours_valid', sql`hours > 0 AND hours <= 24 AND FLOOR(hours * 2) = hours * 2`),
    check('chk_no_future_date', sql`entry_date <= CURRENT_DATE`),
    index('time_entries_user_date_idx').on(table.userId, table.entryDate),
    index('time_entries_status_idx').on(table.status),
    index('time_entries_project_date_idx').on(table.projectId, table.entryDate),
  ],
)

export const timerSessions = pgTable(
  'timer_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').notNull(),
    taskId: uuid('task_id').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    stoppedAt: timestamp('stopped_at', { withTimezone: true }),
    status: timerSessionStatusEnum('status').notNull().default('active'),
    timeEntryId: uuid('time_entry_id').references(() => timeEntries.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Composite FK ensures task belongs to the stated project (D0-03)
    foreignKey({
      columns: [table.projectId, table.taskId],
      foreignColumns: [tasks.projectId, tasks.id],
      name: 'timer_sessions_project_task_fk',
    }).onDelete('restrict'),
    // One active timer per user (BRD §5.3)
    uniqueIndex('timer_active_per_user')
      .on(table.userId)
      .where(sql`stopped_at IS NULL`),
    // One pending-save session per user (§1.5, D0-10)
    uniqueIndex('timer_stopped_per_user')
      .on(table.userId)
      .where(sql`status = 'stopped'`),
  ],
)

// Type helpers for Drizzle insert/select
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type UserProject = typeof userProjects.$inferSelect
export type NewUserProject = typeof userProjects.$inferInsert
export type TimeEntry = typeof timeEntries.$inferSelect
export type NewTimeEntry = typeof timeEntries.$inferInsert
export type TimerSession = typeof timerSessions.$inferSelect
export type NewTimerSession = typeof timerSessions.$inferInsert
