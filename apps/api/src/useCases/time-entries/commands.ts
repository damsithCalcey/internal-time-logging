import { db } from '@/db/client.js'
import { timeEntriesRepo, userProjectsRepo } from '@/db/repositories/index.js'
import type { Tx } from '@/db/tx.js'
import { TimeEntry, type Actor, type FieldPatch, type Plan } from '@/domain/time-entry.js'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/shared/errors.js'
import type { CreateTimeEntryBody, UpdateTimeEntryBody } from '@repo/shared-types'

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

export async function applyTimeEntryPlan(id: string, plan: Plan) {
  if (!plan.ok) throw new ConflictError(plan.reason, 'invalid-transition')
  const updated = await timeEntriesRepo.applyPlan(db, id, plan.expectedStatus, plan.patch)
  if (!updated) throw new ConflictError('Entry status changed; please retry', 'invalid-transition')
  return updated
}

export async function createTimeEntry(
  callerId: string,
  callerRole: string,
  data: CreateTimeEntryBody,
) {
  const userId = callerRole === 'manager' && data.userId ? data.userId : callerId

  if (callerRole !== 'manager') {
    const assignment = await userProjectsRepo.findOne(db, userId, data.projectId)
    if (!assignment) throw new ForbiddenError('You are not assigned to this project')
  }

  const today = new Date().toISOString().slice(0, 10)
  if (data.entryDate > today) throw new ValidationError('Entry date cannot be in the future')

  await checkDailyCap(db, userId, data.entryDate, data.hours)

  return timeEntriesRepo.createDraft(db, {
    userId,
    projectId: data.projectId,
    taskId: data.taskId,
    entryDate: data.entryDate,
    hours: String(data.hours),
    notes: data.notes ?? null,
  })
}

function actorOf(callerId: string, callerRole: string): Actor {
  return { id: callerId, role: callerRole === 'manager' ? 'manager' : 'employee' }
}

function fieldPatchOf(data: UpdateTimeEntryBody): FieldPatch {
  const patch: FieldPatch = {}
  if (data.projectId !== undefined) patch.projectId = data.projectId
  if (data.taskId !== undefined) patch.taskId = data.taskId
  if (data.entryDate !== undefined) patch.entryDate = data.entryDate
  if (data.hours !== undefined) patch.hours = String(data.hours)
  if (data.notes !== undefined) patch.notes = data.notes
  return patch
}

export async function updateTimeEntry(
  callerId: string,
  callerRole: string,
  id: string,
  data: UpdateTimeEntryBody,
) {
  const row = await timeEntriesRepo.findById(db, id)
  if (!row) throw new NotFoundError('Time entry not found')
  const entry = TimeEntry.from(row)
  const actor = actorOf(callerId, callerRole)

  if (actor.role !== 'manager') {
    if (entry.userId !== callerId) throw new ForbiddenError("Cannot edit another user's entry")
    if (data.projectId && data.projectId !== row.projectId) {
      const assignment = await userProjectsRepo.findOne(db, entry.userId, data.projectId)
      if (!assignment) throw new ForbiddenError('You are not assigned to this project')
    }
  }

  if (data.entryDate) {
    const today = new Date().toISOString().slice(0, 10)
    if (data.entryDate > today) throw new ValidationError('Entry date cannot be in the future')
  }

  if (data.hours !== undefined || data.entryDate !== undefined) {
    await checkDailyCap(
      db,
      entry.userId,
      data.entryDate ?? row.entryDate,
      data.hours ?? parseFloat(row.hours),
      entry.id,
    )
  }

  const patch = fieldPatchOf(data)
  const plan =
    actor.role === 'manager' ? entry.editAsManager(actor, patch) : entry.editAsEmployee(patch)
  return applyTimeEntryPlan(entry.id, plan)
}

export async function submitEntry(callerId: string, callerRole: string, id: string) {
  const row = await timeEntriesRepo.findById(db, id)
  if (!row) throw new NotFoundError('Time entry not found')

  if (callerRole !== 'manager' && row.userId !== callerId) {
    throw new ForbiddenError("Cannot submit another user's entry")
  }

  const entry = TimeEntry.from(row)
  const plan = entry.submit()
  if (!plan.ok) {
    throw new ConflictError(
      `Entry cannot be submitted (current status: '${row.status}')`,
      'invalid-transition',
    )
  }
  return applyTimeEntryPlan(entry.id, plan)
}

export async function withdrawEntry(callerId: string, callerRole: string, id: string) {
  const row = await timeEntriesRepo.findById(db, id)
  if (!row) throw new NotFoundError('Time entry not found')

  if (callerRole !== 'manager' && row.userId !== callerId) {
    throw new ForbiddenError("Cannot withdraw another user's entry")
  }

  const entry = TimeEntry.from(row)
  const plan = entry.withdraw()
  if (!plan.ok) {
    throw new ConflictError('Entry cannot be withdrawn (already actioned)', 'entry-already-actioned')
  }
  return applyTimeEntryPlan(entry.id, plan)
}

// Cross-use-case: called by useCases/users/commands when deactivating a user
export async function rejectAllSubmittedFor(
  tx: Tx,
  userId: string,
  managerNote: string,
): Promise<void> {
  await timeEntriesRepo.rejectAllSubmittedFor(tx, userId, managerNote)
}
