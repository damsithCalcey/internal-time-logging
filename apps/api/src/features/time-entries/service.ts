import { db } from '@/db/client.js'
import * as timeEntriesRepo from '@/db/repositories/time-entries.js'
import * as userProjectsRepo from '@/db/repositories/user-projects.js'
import type { TimeEntry } from '@/db/schema.js'
import type { Tx } from '@/db/tx.js'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/shared/errors.js'
import { canTransition } from '@/shared/state-machine.js'
import type { CreateTimeEntryBody, UpdateTimeEntryBody } from '@repo/shared-types'

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

async function checkDailyCap(
  d: typeof db | Tx,
  userId: string,
  entryDate: string,
  hours: number,
  excludeId?: string,
): Promise<void> {
  const existingHours = await timeEntriesRepo.sumHoursForDate(d, userId, entryDate, excludeId)
  if (existingHours + hours > 24) {
    throw new ValidationError(
      `Daily total would exceed 24 hours (current: ${existingHours}h, adding: ${hours}h)`,
    )
  }
}

export async function createTimeEntry(
  callerId: string,
  callerRole: string,
  data: CreateTimeEntryBody,
) {
  // Manager may create on behalf of another user; employee can only log for themselves
  const userId = callerRole === 'manager' && data.userId ? data.userId : callerId

  // Employees must be assigned to the project
  if (callerRole !== 'manager') {
    const assignment = await userProjectsRepo.findOne(db, userId, data.projectId)
    if (!assignment) throw new ForbiddenError('You are not assigned to this project')
  }

  const today = new Date().toISOString().slice(0, 10)
  if (data.entryDate > today) throw new ValidationError('Entry date cannot be in the future')

  await checkDailyCap(db, userId, data.entryDate, data.hours)

  const entry = await timeEntriesRepo.createDraft(db, {
    userId,
    projectId: data.projectId,
    taskId: data.taskId,
    entryDate: data.entryDate,
    hours: String(data.hours),
    notes: data.notes ?? null,
  })
  return serializeEntry(entry)
}

export async function updateTimeEntry(
  callerId: string,
  callerRole: string,
  id: string,
  data: UpdateTimeEntryBody,
) {
  const entry = await timeEntriesRepo.findById(db, id)
  if (!entry) throw new NotFoundError('Time entry not found')

  if (callerRole !== 'manager') {
    if (entry.userId !== callerId) throw new ForbiddenError("Cannot edit another user's entry")
    if (!['draft', 'rejected'].includes(entry.status)) {
      throw new ForbiddenError(`Cannot edit an entry with status '${entry.status}'`)
    }
  }

  const newHours = data.hours ?? parseFloat(entry.hours)
  const newDate = data.entryDate ?? entry.entryDate
  const newProjectId = data.projectId ?? entry.projectId

  if (callerRole !== 'manager' && data.projectId && data.projectId !== entry.projectId) {
    const assignment = await userProjectsRepo.findOne(db, entry.userId, newProjectId)
    if (!assignment) throw new ForbiddenError('You are not assigned to this project')
  }

  if (data.entryDate) {
    const today = new Date().toISOString().slice(0, 10)
    if (data.entryDate > today) throw new ValidationError('Entry date cannot be in the future')
  }

  if (data.hours !== undefined || data.entryDate !== undefined) {
    await checkDailyCap(db, entry.userId, newDate, newHours, id)
  }

  const baseFields = {
    ...(data.projectId !== undefined && { projectId: data.projectId }),
    ...(data.taskId !== undefined && { taskId: data.taskId }),
    ...(data.entryDate !== undefined && { entryDate: data.entryDate }),
    ...(data.hours !== undefined && { hours: String(data.hours) }),
    ...(data.notes !== undefined && { notes: data.notes }),
  }

  // Manager editing an approved entry → transition to amended (populate amendment metadata)
  if (callerRole === 'manager' && entry.status === 'approved') {
    const sm = canTransition('approved', 'amended', 'manager')
    if (!sm.ok) throw new ForbiddenError(sm.reason)

    const updated = await timeEntriesRepo.transitionStatus(db, id, 'approved', 'amended', {
      ...baseFields,
      amendedAt: new Date(),
      amendedBy: callerId,
      // Populate once: if originalHours is already set keep it, otherwise capture current hours
      originalHours: entry.originalHours ?? entry.hours,
    })
    if (!updated) throw new NotFoundError('Time entry not found')
    return serializeEntry(updated)
  }

  // Manager editing an already-amended entry → status stays amended, refresh amendment metadata
  if (callerRole === 'manager' && entry.status === 'amended') {
    const updated = await timeEntriesRepo.update(db, id, {
      ...baseFields,
      amendedAt: new Date(),
      amendedBy: callerId,
      // originalHours is preserved (S4: populate once)
    })
    if (!updated) throw new NotFoundError('Time entry not found')
    return serializeEntry(updated)
  }

  const patch = {
    ...baseFields,
    // Employee editing a rejected entry: status transitions to draft on save
    ...(callerRole !== 'manager' && entry.status === 'rejected' && { status: 'draft' as const }),
  }

  const updated = await timeEntriesRepo.update(db, id, patch)
  if (!updated) throw new NotFoundError('Time entry not found')
  return serializeEntry(updated)
}

export async function submitEntry(callerId: string, callerRole: string, id: string) {
  const entry = await timeEntriesRepo.findById(db, id)
  if (!entry) throw new NotFoundError('Time entry not found')

  if (callerRole !== 'manager' && entry.userId !== callerId) {
    throw new ForbiddenError("Cannot submit another user's entry")
  }

  const updated = await timeEntriesRepo.transitionStatus(db, id, 'draft', 'submitted')
  if (!updated) {
    throw new ConflictError(
      `Entry cannot be submitted (current status: '${entry.status}')`,
      'invalid-transition',
    )
  }
  return serializeEntry(updated)
}

export async function withdrawEntry(callerId: string, callerRole: string, id: string) {
  const entry = await timeEntriesRepo.findById(db, id)
  if (!entry) throw new NotFoundError('Time entry not found')

  if (callerRole !== 'manager' && entry.userId !== callerId) {
    throw new ForbiddenError("Cannot withdraw another user's entry")
  }

  // Race-safe: only succeeds if current status is 'submitted'
  const updated = await timeEntriesRepo.transitionStatus(db, id, 'submitted', 'draft')
  if (!updated) {
    throw new ConflictError(
      'Entry cannot be withdrawn (already actioned)',
      'entry-already-actioned',
    )
  }
  return serializeEntry(updated)
}

export async function getEntry(callerId: string, callerRole: string, id: string) {
  const entry = await timeEntriesRepo.findById(db, id)
  if (!entry) throw new NotFoundError('Time entry not found')
  if (callerRole !== 'manager' && entry.userId !== callerId) {
    throw new NotFoundError('Time entry not found')
  }
  return serializeEntry(entry)
}

export async function listForUser(
  callerId: string,
  callerRole: string,
  userId?: string,
  date?: string,
) {
  const targetId = callerRole === 'manager' && userId ? userId : callerId
  const entries = date
    ? await timeEntriesRepo.findByUserAndDate(db, targetId, date)
    : await timeEntriesRepo.findByUser(db, targetId)
  return entries.map(serializeEntry)
}

// Called by admin-users/service via the acyclic service graph (§1.3)
export async function rejectAllSubmittedFor(
  tx: Tx,
  userId: string,
  managerNote: string,
): Promise<void> {
  await timeEntriesRepo.rejectAllSubmittedFor(tx, userId, managerNote)
}
