import { db } from '@/db/client.js'
import * as timeEntriesRepo from '@/db/repositories/time-entries.js'
import { serializeEnrichedEntry, serializeTimeEntry } from '@/db/serializers.js'
import type { TimeEntry } from '@/db/schema.js'
import { ConflictError, NotFoundError } from '@/shared/errors.js'
import { canTransition } from '@/shared/state-machine.js'

export async function getQueue(filters: {
  status?: TimeEntry['status']
  userId?: string
  from?: string
  to?: string
}) {
  const rows = await timeEntriesRepo.findForQueue(db, filters)
  return rows.map(serializeEnrichedEntry)
}

export async function approveEntry(managerId: string, id: string) {
  const entry = await timeEntriesRepo.findById(db, id)
  if (!entry) throw new NotFoundError('Time entry not found')

  const sm = canTransition(entry.status, 'approved', 'manager')
  if (!sm.ok) throw new ConflictError(sm.reason, 'invalid-transition')

  const updated = await timeEntriesRepo.transitionStatus(db, id, 'submitted', 'approved')
  if (!updated)
    throw new ConflictError('Entry cannot be approved (status changed)', 'invalid-transition')
  return serializeTimeEntry(updated)
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
  return serializeTimeEntry(updated)
}
