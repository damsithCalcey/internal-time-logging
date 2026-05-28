import { and, eq, inArray } from 'drizzle-orm'
import type { db } from '../client.js'
import { timerSessions, type NewTimerSession, type TimerSession } from '../schema.js'
import type { Tx } from '../tx.js'

type DB = Tx | typeof db

export interface TimerSessionsRepo {
  findById(d: DB, id: string): Promise<TimerSession | null>
  findByIdForUser(d: DB, id: string, userId: string): Promise<TimerSession | null>
  findActiveOrStopped(d: DB, userId: string): Promise<TimerSession | null>
  insert(d: DB, data: NewTimerSession): Promise<TimerSession>
  markStopped(d: DB, id: string, stoppedAt: Date): Promise<TimerSession | null>
  markSaved(d: DB, id: string, timeEntryId: string): Promise<TimerSession | null>
  markDiscarded(d: DB, id: string): Promise<TimerSession | null>
  discardActiveFor(d: DB, userId: string): Promise<TimerSession[]>
}

export const findById: TimerSessionsRepo['findById'] = (d, id) =>
  d
    .select()
    .from(timerSessions)
    .where(eq(timerSessions.id, id))
    .then((r) => r[0] ?? null)

export const findByIdForUser: TimerSessionsRepo['findByIdForUser'] = (d, id, userId) =>
  d
    .select()
    .from(timerSessions)
    .where(and(eq(timerSessions.id, id), eq(timerSessions.userId, userId)))
    .then((r) => r[0] ?? null)

// Returns the active or stopped (pending-save) session for a user, or null
export const findActiveOrStopped: TimerSessionsRepo['findActiveOrStopped'] = (d, userId) =>
  d
    .select()
    .from(timerSessions)
    .where(
      and(eq(timerSessions.userId, userId), inArray(timerSessions.status, ['active', 'stopped'])),
    )
    .then((r) => r[0] ?? null)

export const insert: TimerSessionsRepo['insert'] = (d, data) =>
  d
    .insert(timerSessions)
    .values(data)
    .returning()
    .then((r) => r[0]!)

export const markStopped: TimerSessionsRepo['markStopped'] = (d, id, stoppedAt) =>
  d
    .update(timerSessions)
    .set({ stoppedAt, status: 'stopped' })
    .where(and(eq(timerSessions.id, id), eq(timerSessions.status, 'active')))
    .returning()
    .then((r) => r[0] ?? null)

export const markSaved: TimerSessionsRepo['markSaved'] = (d, id, timeEntryId) =>
  d
    .update(timerSessions)
    .set({ timeEntryId, status: 'saved' })
    .where(and(eq(timerSessions.id, id), eq(timerSessions.status, 'stopped')))
    .returning()
    .then((r) => r[0] ?? null)

export const markDiscarded: TimerSessionsRepo['markDiscarded'] = (d, id) =>
  d
    .update(timerSessions)
    .set({ status: 'discarded' })
    .where(and(eq(timerSessions.id, id), eq(timerSessions.status, 'stopped')))
    .returning()
    .then((r) => r[0] ?? null)

// Called by admin-users/service via the acyclic service graph (§1.3)
// Sets status='discarded' (NOT 'stopped') so it doesn't appear as pending-save (§1.5, D0-10)
export const discardActiveFor: TimerSessionsRepo['discardActiveFor'] = (d, userId) =>
  d
    .update(timerSessions)
    .set({ stoppedAt: new Date(), status: 'discarded' })
    .where(and(eq(timerSessions.userId, userId), eq(timerSessions.status, 'active')))
    .returning()

export const timerSessionsRepo = {
  findById,
  findByIdForUser,
  findActiveOrStopped,
  insert,
  markStopped,
  markSaved,
  markDiscarded,
  discardActiveFor,
} satisfies TimerSessionsRepo
