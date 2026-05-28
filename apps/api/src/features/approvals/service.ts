import { db } from '@/db/client.js'
import * as timeEntriesRepo from '@/db/repositories/time-entries.js'
import type { TimeEntry } from '@/db/schema.js'
import { ConflictError, NotFoundError } from '@/shared/errors.js'
import { canTransition } from '@/shared/state-machine.js'

function serializeQueueItem(row: Awaited<ReturnType<typeof timeEntriesRepo.findForQueue>>[number]) {
  return {
    ...row,
    hours: parseFloat(row.hours),
    originalHours: row.originalHours != null ? parseFloat(row.originalHours) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    amendedAt: row.amendedAt?.toISOString() ?? null,
  }
}

function serializeEntry(entry: TimeEntry) {
  return {
    ...entry,
    hours: parseFloat(entry.hours),
    originalHours: entry.originalHours != null ? parseFloat(entry.originalHours) : null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    amendedAt: entry.amendedAt?.toISOString() ?? null,
  }
}

export async function getQueue(filters: {
  status?: TimeEntry['status']
  userId?: string
  from?: string
  to?: string
}) {
  const rows = await timeEntriesRepo.findForQueue(db, filters)
  return rows.map(serializeQueueItem)
}

export async function approveEntry(managerId: string, id: string) {
  const entry = await timeEntriesRepo.findById(db, id)
  if (!entry) throw new NotFoundError('Time entry not found')

  const sm = canTransition(entry.status, 'approved', 'manager')
  if (!sm.ok) throw new ConflictError(sm.reason, 'invalid-transition')

  const updated = await timeEntriesRepo.transitionStatus(db, id, 'submitted', 'approved')
  if (!updated)
    throw new ConflictError('Entry cannot be approved (status changed)', 'invalid-transition')
  return serializeEntry(updated)
}

export async function rejectEntry(managerId: string, id: string, note: string) {
  const entry = await timeEntriesRepo.findById(db, id)
  if (!entry) throw new NotFoundError('Time entry not found')

  const sm = canTransition(entry.status, 'rejected', 'manager')
  if (!sm.ok) throw new ConflictError(sm.reason, 'invalid-transition')

  // Service-layer double-check on note (Zod already caught empty/whitespace at route level)
  if (!note.trim()) throw new ConflictError('Rejection note is required', 'invalid-transition')

  const updated = await timeEntriesRepo.transitionStatus(db, id, 'submitted', 'rejected', {
    managerNote: note.trim(),
  })
  if (!updated)
    throw new ConflictError('Entry cannot be rejected (status changed)', 'invalid-transition')
  return serializeEntry(updated)
}
