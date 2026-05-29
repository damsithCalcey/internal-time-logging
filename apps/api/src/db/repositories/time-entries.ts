import { and, eq, gte, lte, ne, sql, sum } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import type { db } from '../client.js'
import {
  projects,
  tasks,
  timeEntries,
  users,
  type NewTimeEntry,
  type TimeEntry,
} from '../schema.js'
export type { TimeEntry } from '../schema.js'
import type { Tx } from '../tx.js'

type DB = Tx | typeof db

export type EnrichedTimeEntryRow = {
  id: string
  userId: string
  projectId: string
  taskId: string
  entryDate: string
  hours: string
  notes: string | null
  status: TimeEntry['status']
  managerNote: string | null
  amendedAt: Date | null
  amendedBy: string | null
  originalHours: string | null
  createdAt: Date
  updatedAt: Date
  userName: string
  projectName: string
  taskName: string
  amendedByName: string | null
}

export type EnrichedLogFilters = {
  date?: string
  from?: string
  to?: string
  userId?: string
}

export type QueueFilters = {
  status?: TimeEntry['status']
  userId?: string
  from?: string
  to?: string
}

// Patch produced by the TimeEntry domain entity. May include a `status` field
// when the operation is a state transition, or omit it for guarded field updates.
export type TimeEntryPatch = Partial<Omit<NewTimeEntry, 'id' | 'createdAt'>>

export interface TimeEntriesRepo {
  findById(d: DB, id: string): Promise<TimeEntry | null>
  findByUser(d: DB, userId: string): Promise<TimeEntry[]>
  findByUserAndDate(d: DB, userId: string, entryDate: string): Promise<TimeEntry[]>
  createDraft(d: DB, data: Omit<NewTimeEntry, 'status'>): Promise<TimeEntry>
  sumHoursForDate(d: DB, userId: string, entryDate: string, excludeId?: string): Promise<number>
  rejectAllSubmittedFor(d: DB, userId: string, managerNote: string): Promise<TimeEntry[]>
  // Conditional UPDATE: applies `patch` only when the row is still in `expectedStatus`.
  // Returns null when the guard fails (concurrent transition) — caller treats as 409.
  applyPlan(
    d: DB,
    id: string,
    expectedStatus: TimeEntry['status'],
    patch: TimeEntryPatch,
  ): Promise<TimeEntry | null>
  findByStatus(d: DB, status: TimeEntry['status']): Promise<TimeEntry[]>
  findSubmittedByUser(d: DB, userId: string): Promise<TimeEntry[]>
  countForDateExcluding(
    d: DB,
    userId: string,
    entryDate: string,
    excludeId: string,
  ): Promise<number>
  findEnrichedForLog(d: DB, filters: EnrichedLogFilters): Promise<EnrichedTimeEntryRow[]>
  findForQueue(d: DB, filters: QueueFilters): Promise<EnrichedTimeEntryRow[]>
}

export const findById: TimeEntriesRepo['findById'] = (d, id) =>
  d
    .select()
    .from(timeEntries)
    .where(eq(timeEntries.id, id))
    .then((r) => r[0] ?? null)

export const findByUser: TimeEntriesRepo['findByUser'] = (d, userId) =>
  d.select().from(timeEntries).where(eq(timeEntries.userId, userId))

export const findByUserAndDate: TimeEntriesRepo['findByUserAndDate'] = (d, userId, entryDate) =>
  d
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), eq(timeEntries.entryDate, entryDate)))

export const createDraft: TimeEntriesRepo['createDraft'] = (d, data) =>
  d
    .insert(timeEntries)
    .values({ ...data, status: 'draft' })
    .returning()
    .then((r) => r[0]!)

// Sum of hours for a user on a date, excluding a specific entry (for daily cap check - S1)
export const sumHoursForDate: TimeEntriesRepo['sumHoursForDate'] = async (
  d,
  userId,
  entryDate,
  excludeId,
) => {
  const conditions = excludeId
    ? and(
        eq(timeEntries.userId, userId),
        eq(timeEntries.entryDate, entryDate),
        ne(timeEntries.id, excludeId),
      )
    : and(eq(timeEntries.userId, userId), eq(timeEntries.entryDate, entryDate))

  const result = await d
    .select({ total: sum(timeEntries.hours) })
    .from(timeEntries)
    .where(conditions)

  return parseFloat(result[0]?.total ?? '0')
}

// Used by admin-users/service via the acyclic service graph (§1.3)
export const rejectAllSubmittedFor: TimeEntriesRepo['rejectAllSubmittedFor'] = (
  d,
  userId,
  managerNote,
) =>
  d
    .update(timeEntries)
    .set({ status: 'rejected', managerNote })
    .where(and(eq(timeEntries.userId, userId), eq(timeEntries.status, 'submitted')))
    .returning()

// Race-safe persistence: SET patch WHERE id=? AND status=expectedStatus
// Used by every TimeEntry entity operation (submit / withdraw / approve / reject / amend / edit).
export const applyPlan: TimeEntriesRepo['applyPlan'] = (d, id, expectedStatus, patch) =>
  d
    .update(timeEntries)
    .set(patch)
    .where(and(eq(timeEntries.id, id), eq(timeEntries.status, expectedStatus)))
    .returning()
    .then((r) => r[0] ?? null)

export const findByStatus: TimeEntriesRepo['findByStatus'] = (d, status) =>
  d.select().from(timeEntries).where(eq(timeEntries.status, status))

export const findSubmittedByUser: TimeEntriesRepo['findSubmittedByUser'] = (d, userId) =>
  d
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), eq(timeEntries.status, 'submitted')))

export const countForDateExcluding: TimeEntriesRepo['countForDateExcluding'] = (
  d,
  userId,
  entryDate,
  excludeId,
) =>
  d
    .select({ count: sql<number>`count(*)::int` })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        eq(timeEntries.entryDate, entryDate),
        ne(timeEntries.id, excludeId),
      ),
    )
    .then((r) => r[0]?.count ?? 0)

// Enriched log view: time entry joined with user/project/task names for daily log and weekly summary
export const findEnrichedForLog: TimeEntriesRepo['findEnrichedForLog'] = (d, filters) => {
  const amendedByUser = alias(users, 'amended_by_user')

  return d
    .select({
      id: timeEntries.id,
      userId: timeEntries.userId,
      projectId: timeEntries.projectId,
      taskId: timeEntries.taskId,
      entryDate: timeEntries.entryDate,
      hours: timeEntries.hours,
      notes: timeEntries.notes,
      status: timeEntries.status,
      managerNote: timeEntries.managerNote,
      amendedAt: timeEntries.amendedAt,
      amendedBy: timeEntries.amendedBy,
      originalHours: timeEntries.originalHours,
      createdAt: timeEntries.createdAt,
      updatedAt: timeEntries.updatedAt,
      userName: users.fullName,
      projectName: projects.name,
      taskName: tasks.name,
      amendedByName: amendedByUser.fullName,
    })
    .from(timeEntries)
    .innerJoin(users, eq(timeEntries.userId, users.id))
    .innerJoin(projects, eq(timeEntries.projectId, projects.id))
    .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
    .leftJoin(amendedByUser, eq(timeEntries.amendedBy, amendedByUser.id))
    .where(
      and(
        filters.date ? eq(timeEntries.entryDate, filters.date) : undefined,
        filters.from ? gte(timeEntries.entryDate, filters.from) : undefined,
        filters.to ? lte(timeEntries.entryDate, filters.to) : undefined,
        filters.userId ? eq(timeEntries.userId, filters.userId) : undefined,
      ),
    )
    .orderBy(timeEntries.entryDate, timeEntries.createdAt)
}

// Enriched queue view: time entry joined with user/project/task names for the approval queue
export const findForQueue: TimeEntriesRepo['findForQueue'] = (d, filters) => {
  const amendedByUser = alias(users, 'amended_by_user')

  return d
    .select({
      id: timeEntries.id,
      userId: timeEntries.userId,
      projectId: timeEntries.projectId,
      taskId: timeEntries.taskId,
      entryDate: timeEntries.entryDate,
      hours: timeEntries.hours,
      notes: timeEntries.notes,
      status: timeEntries.status,
      managerNote: timeEntries.managerNote,
      amendedAt: timeEntries.amendedAt,
      amendedBy: timeEntries.amendedBy,
      originalHours: timeEntries.originalHours,
      createdAt: timeEntries.createdAt,
      updatedAt: timeEntries.updatedAt,
      userName: users.fullName,
      projectName: projects.name,
      taskName: tasks.name,
      amendedByName: amendedByUser.fullName,
    })
    .from(timeEntries)
    .innerJoin(users, eq(timeEntries.userId, users.id))
    .innerJoin(projects, eq(timeEntries.projectId, projects.id))
    .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
    .leftJoin(amendedByUser, eq(timeEntries.amendedBy, amendedByUser.id))
    .where(
      and(
        eq(timeEntries.status, filters.status ?? 'submitted'),
        filters.userId ? eq(timeEntries.userId, filters.userId) : undefined,
        filters.from ? gte(timeEntries.entryDate, filters.from) : undefined,
        filters.to ? lte(timeEntries.entryDate, filters.to) : undefined,
      ),
    )
    .orderBy(timeEntries.entryDate)
}

export const timeEntriesRepo = {
  findById,
  findByUser,
  findByUserAndDate,
  createDraft,
  sumHoursForDate,
  rejectAllSubmittedFor,
  applyPlan,
  findByStatus,
  findSubmittedByUser,
  countForDateExcluding,
  findEnrichedForLog,
  findForQueue,
} satisfies TimeEntriesRepo
