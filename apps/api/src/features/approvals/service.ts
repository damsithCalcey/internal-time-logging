import { db } from '@/db/client.js'
import { timeEntriesRepo } from '@/db/repositories/index.js'
import { serializeEnrichedEntry, serializeTimeEntry } from '@/db/serializers.js'
import { TimeEntry, type Actor, type Plan } from '@/domain/time-entry.js'
import { ConflictError, NotFoundError } from '@/shared/errors.js'
import type { TimeEntryStatus } from '@repo/shared-types'

async function persist(id: string, plan: Plan) {
  if (!plan.ok) throw new ConflictError(plan.reason, 'invalid-transition')
  const updated = await timeEntriesRepo.applyPlan(db, id, plan.expectedStatus, plan.patch)
  if (!updated) {
    throw new ConflictError('Entry status changed; please retry', 'invalid-transition')
  }
  return serializeTimeEntry(updated)
}

export async function getQueue(filters: {
  status?: TimeEntryStatus
  userId?: string
  from?: string
  to?: string
}) {
  const rows = await timeEntriesRepo.findForQueue(db, filters)
  return rows.map(serializeEnrichedEntry)
}

export async function approveEntry(managerId: string, id: string) {
  const row = await timeEntriesRepo.findById(db, id)
  if (!row) throw new NotFoundError('Time entry not found')

  const actor: Actor = { id: managerId, role: 'manager' }
  return persist(id, TimeEntry.from(row).approve(actor))
}

export async function rejectEntry(managerId: string, id: string, note: string) {
  const row = await timeEntriesRepo.findById(db, id)
  if (!row) throw new NotFoundError('Time entry not found')

  const actor: Actor = { id: managerId, role: 'manager' }
  return persist(id, TimeEntry.from(row).reject(actor, note))
}
