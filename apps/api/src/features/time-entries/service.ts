import { db } from '@/db/client.js'
import { timeEntriesRepo, userProjectsRepo } from '@/db/repositories/index.js'
import { serializeEnrichedEntry, serializeTimeEntry } from '@/db/serializers.js'
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

// Resolves an entity's Plan into a persisted row.
// `Plan.ok === false` is a 409 (state-machine violation); a null return from
// applyPlan means the row's status changed between read and write — also a 409.
async function persist(id: string, plan: Plan) {
  if (!plan.ok) throw new ConflictError(plan.reason, 'invalid-transition')
  const updated = await timeEntriesRepo.applyPlan(db, id, plan.expectedStatus, plan.patch)
  if (!updated) {
    throw new ConflictError('Entry status changed; please retry', 'invalid-transition')
  }
  return serializeTimeEntry(updated)
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
  return serializeTimeEntry(entry)
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

  // Cross-row authz + invariants stay in the service: the entity owns within-row semantics.
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
  const plan = actor.role === 'manager' ? entry.editAsManager(actor, patch) : entry.editAsEmployee(patch)
  return persist(entry.id, plan)
}

export async function submitEntry(callerId: string, callerRole: string, id: string) {
  const row = await timeEntriesRepo.findById(db, id)
  if (!row) throw new NotFoundError('Time entry not found')

  if (callerRole !== 'manager' && row.userId !== callerId) {
    throw new ForbiddenError("Cannot submit another user's entry")
  }

  const entry = TimeEntry.from(row)
  const plan = entry.submit()
  // Map a state-machine failure here to the existing "invalid transition" 409 with the row's status in the message,
  // matching the prior service error string for callers/tests that depend on it.
  if (!plan.ok) {
    throw new ConflictError(
      `Entry cannot be submitted (current status: '${row.status}')`,
      'invalid-transition',
    )
  }
  return persist(entry.id, plan)
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
  return persist(entry.id, plan)
}

export async function getEntry(callerId: string, callerRole: string, id: string) {
  const entry = await timeEntriesRepo.findById(db, id)
  if (!entry) throw new NotFoundError('Time entry not found')
  if (callerRole !== 'manager' && entry.userId !== callerId) {
    throw new NotFoundError('Time entry not found')
  }
  return serializeTimeEntry(entry)
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
  return entries.map(serializeTimeEntry)
}

function parseIsoWeek(week: string): { from: string; to: string } {
  const match = /^(\d{4})-W(\d{2})$/.exec(week)
  if (!match) throw new ValidationError('Week must be in YYYY-Www format (e.g. 2026-W21)')

  const year = parseInt(match[1]!, 10)
  const weekNum = parseInt(match[2]!, 10)
  if (weekNum < 1 || weekNum > 53) throw new ValidationError('Week number must be between 1 and 53')

  // Jan 4 is always in ISO week 1. Find the Monday of that week.
  const jan4 = new Date(year, 0, 4)
  const jan4DayOfWeek = (jan4.getDay() + 6) % 7 // 0=Monday … 6=Sunday
  const week1Monday = new Date(year, 0, 4 - jan4DayOfWeek)

  const targetMonday = new Date(week1Monday)
  targetMonday.setDate(week1Monday.getDate() + (weekNum - 1) * 7)

  const targetSunday = new Date(targetMonday)
  targetSunday.setDate(targetMonday.getDate() + 6)

  const toDateStr = (d: Date) => d.toISOString().slice(0, 10)
  return { from: toDateStr(targetMonday), to: toDateStr(targetSunday) }
}

export async function getDailyEntries(
  callerId: string,
  callerRole: string,
  date: string,
  userId?: string,
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ValidationError('Date must be in YYYY-MM-DD format')
  }

  // Managers can filter by a specific user or see all; employees always see only their own
  const targetUserId =
    callerRole === 'manager'
      ? userId // may be undefined → all users
      : callerId

  const filters = targetUserId ? { date, userId: targetUserId } : { date }
  const entries = await timeEntriesRepo.findEnrichedForLog(db, filters)
  return entries.map(serializeEnrichedEntry)
}

export async function getWeeklyEntries(
  callerId: string,
  callerRole: string,
  week: string,
  userId?: string,
) {
  const { from, to } = parseIsoWeek(week)

  const targetUserId =
    callerRole === 'manager'
      ? userId // may be undefined → all users
      : callerId

  const filters = targetUserId ? { from, to, userId: targetUserId } : { from, to }
  const entries = await timeEntriesRepo.findEnrichedForLog(db, filters)
  return entries.map(serializeEnrichedEntry)
}

// Called by admin-users/service via the acyclic service graph (§1.3)
export async function rejectAllSubmittedFor(
  tx: Tx,
  userId: string,
  managerNote: string,
): Promise<void> {
  await timeEntriesRepo.rejectAllSubmittedFor(tx, userId, managerNote)
}
