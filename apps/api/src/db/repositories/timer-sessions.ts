import { and, eq, inArray } from 'drizzle-orm'
import type { db } from '../client.js'
import { timerSessions, type NewTimerSession, type TimerSession } from '../schema.js'
import type { Tx } from '../tx.js'

type DB = Tx | typeof db

export const findById = (d: DB, id: string): Promise<TimerSession | null> =>
  d
    .select()
    .from(timerSessions)
    .where(eq(timerSessions.id, id))
    .then((r) => r[0] ?? null)

export const findByIdForUser = (d: DB, id: string, userId: string): Promise<TimerSession | null> =>
  d
    .select()
    .from(timerSessions)
    .where(and(eq(timerSessions.id, id), eq(timerSessions.userId, userId)))
    .then((r) => r[0] ?? null)

// Returns the active or stopped (pending-save) session for a user, or null
export const findActiveOrStopped = (d: DB, userId: string): Promise<TimerSession | null> =>
  d
    .select()
    .from(timerSessions)
    .where(
      and(eq(timerSessions.userId, userId), inArray(timerSessions.status, ['active', 'stopped'])),
    )
    .then((r) => r[0] ?? null)

export const insert = (d: DB, data: NewTimerSession): Promise<TimerSession> =>
  d
    .insert(timerSessions)
    .values(data)
    .returning()
    .then((r) => r[0]!)

export const markStopped = (d: DB, id: string, stoppedAt: Date): Promise<TimerSession | null> =>
  d
    .update(timerSessions)
    .set({ stoppedAt, status: 'stopped' })
    .where(and(eq(timerSessions.id, id), eq(timerSessions.status, 'active')))
    .returning()
    .then((r) => r[0] ?? null)

export const markSaved = (d: DB, id: string, timeEntryId: string): Promise<TimerSession | null> =>
  d
    .update(timerSessions)
    .set({ timeEntryId, status: 'saved' })
    .where(and(eq(timerSessions.id, id), eq(timerSessions.status, 'stopped')))
    .returning()
    .then((r) => r[0] ?? null)

export const markDiscarded = (d: DB, id: string): Promise<TimerSession | null> =>
  d
    .update(timerSessions)
    .set({ status: 'discarded' })
    .where(and(eq(timerSessions.id, id), eq(timerSessions.status, 'stopped')))
    .returning()
    .then((r) => r[0] ?? null)

// Called by admin-users/service via the acyclic service graph (§1.3)
// Sets status='discarded' (NOT 'stopped') so it doesn't appear as pending-save (§1.5, D0-10)
export const discardActiveFor = (d: DB, userId: string): Promise<TimerSession[]> =>
  d
    .update(timerSessions)
    .set({ stoppedAt: new Date(), status: 'discarded' })
    .where(and(eq(timerSessions.userId, userId), eq(timerSessions.status, 'active')))
    .returning()
