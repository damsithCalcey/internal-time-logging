import { and, eq, ne, sql, sum } from 'drizzle-orm'
import type { db } from '../client.js'
import { timeEntries, type NewTimeEntry, type TimeEntry } from '../schema.js'
import type { Tx } from '../tx.js'

type DB = Tx | typeof db

export const findById = (d: DB, id: string): Promise<TimeEntry | null> =>
  d
    .select()
    .from(timeEntries)
    .where(eq(timeEntries.id, id))
    .then((r) => r[0] ?? null)

export const findByUser = (d: DB, userId: string): Promise<TimeEntry[]> =>
  d.select().from(timeEntries).where(eq(timeEntries.userId, userId))

export const findByUserAndDate = (d: DB, userId: string, entryDate: string): Promise<TimeEntry[]> =>
  d
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), eq(timeEntries.entryDate, entryDate)))

export const createDraft = (d: DB, data: Omit<NewTimeEntry, 'status'>): Promise<TimeEntry> =>
  d
    .insert(timeEntries)
    .values({ ...data, status: 'draft' })
    .returning()
    .then((r) => r[0]!)

export const update = (
  d: DB,
  id: string,
  data: Partial<Omit<NewTimeEntry, 'id' | 'createdAt'>>,
): Promise<TimeEntry | null> =>
  d
    .update(timeEntries)
    .set(data)
    .where(eq(timeEntries.id, id))
    .returning()
    .then((r) => r[0] ?? null)

// Sum of hours for a user on a date, excluding a specific entry (for daily cap check - S1)
export const sumHoursForDate = async (
  d: DB,
  userId: string,
  entryDate: string,
  excludeId?: string,
): Promise<number> => {
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
export const rejectAllSubmittedFor = (
  d: DB,
  userId: string,
  managerNote: string,
): Promise<TimeEntry[]> =>
  d
    .update(timeEntries)
    .set({ status: 'rejected', managerNote })
    .where(and(eq(timeEntries.userId, userId), eq(timeEntries.status, 'submitted')))
    .returning()

// Conditional UPDATE — returns the row only if the update applied (race protection)
export const transitionStatus = (
  d: DB,
  id: string,
  fromStatus: TimeEntry['status'],
  toStatus: TimeEntry['status'],
  extra?: Partial<Omit<NewTimeEntry, 'id' | 'status' | 'createdAt'>>,
): Promise<TimeEntry | null> =>
  d
    .update(timeEntries)
    .set({ status: toStatus, ...extra })
    .where(and(eq(timeEntries.id, id), eq(timeEntries.status, fromStatus)))
    .returning()
    .then((r) => r[0] ?? null)

export const findByStatus = (d: DB, status: TimeEntry['status']): Promise<TimeEntry[]> =>
  d.select().from(timeEntries).where(eq(timeEntries.status, status))

export const findSubmittedByUser = (d: DB, userId: string): Promise<TimeEntry[]> =>
  d
    .select()
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), eq(timeEntries.status, 'submitted')))

export const countForDateExcluding = (
  d: DB,
  userId: string,
  entryDate: string,
  excludeId: string,
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
