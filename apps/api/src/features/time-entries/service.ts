import { db } from '@/db/client.js'
import * as timeEntriesRepo from '@/db/repositories/time-entries.js'
import * as userProjectsRepo from '@/db/repositories/user-projects.js'
import { serializeEnrichedEntry, serializeTimeEntry } from '@/db/serializers.js'
import type { Tx } from '@/db/tx.js'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/shared/errors.js'
import { canTransition } from '@/shared/state-machine.js'
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

type DbTimeEntry = NonNullable<Awaited<ReturnType<typeof timeEntriesRepo.findById>>>

async function editAsEmployee(callerId: string, entry: DbTimeEntry, data: UpdateTimeEntryBody) {
  if (entry.userId !== callerId) throw new ForbiddenError("Cannot edit another user's entry")
  if (!['draft', 'rejected'].includes(entry.status)) {
    throw new ForbiddenError(`Cannot edit an entry with status '${entry.status}'`)
  }

  if (data.projectId && data.projectId !== entry.projectId) {
    const assignment = await userProjectsRepo.findOne(db, entry.userId, data.projectId)
    if (!assignment) throw new ForbiddenError('You are not assigned to this project')
  }

  if (data.entryDate) {
    const today = new Date().toISOString().slice(0, 10)
    if (data.entryDate > today) throw new ValidationError('Entry date cannot be in the future')
  }

  if (data.hours !== undefined || data.entryDate !== undefined) {
    await checkDailyCap(
      db,
      entry.userId,
      data.entryDate ?? entry.entryDate,
      data.hours ?? parseFloat(entry.hours),
      entry.id,
    )
  }

  const updated = await timeEntriesRepo.update(db, entry.id, {
    ...(data.projectId !== undefined && { projectId: data.projectId }),
    ...(data.taskId !== undefined && { taskId: data.taskId }),
    ...(data.entryDate !== undefined && { entryDate: data.entryDate }),
    ...(data.hours !== undefined && { hours: String(data.hours) }),
    ...(data.notes !== undefined && { notes: data.notes }),
    // Rejected entry transitions back to draft on any employee edit
    ...(entry.status === 'rejected' && { status: 'draft' as const }),
  })
  if (!updated) throw new NotFoundError('Time entry not found')
  return serializeTimeEntry(updated)
}

async function editAsManager(callerId: string, entry: DbTimeEntry, data: UpdateTimeEntryBody) {
  if (data.entryDate) {
    const today = new Date().toISOString().slice(0, 10)
    if (data.entryDate > today) throw new ValidationError('Entry date cannot be in the future')
  }

  if (data.hours !== undefined || data.entryDate !== undefined) {
    await checkDailyCap(
      db,
      entry.userId,
      data.entryDate ?? entry.entryDate,
      data.hours ?? parseFloat(entry.hours),
      entry.id,
    )
  }

  const baseFields = {
    ...(data.projectId !== undefined && { projectId: data.projectId }),
    ...(data.taskId !== undefined && { taskId: data.taskId }),
    ...(data.entryDate !== undefined && { entryDate: data.entryDate }),
    ...(data.hours !== undefined && { hours: String(data.hours) }),
    ...(data.notes !== undefined && { notes: data.notes }),
  }

  if (entry.status === 'approved') {
    const sm = canTransition('approved', 'amended', 'manager')
    if (!sm.ok) throw new ForbiddenError(sm.reason)

    const updated = await timeEntriesRepo.transitionStatus(db, entry.id, 'approved', 'amended', {
      ...baseFields,
      amendedAt: new Date(),
      amendedBy: callerId,
      // Populate once: if originalHours is already set keep it, otherwise capture current hours
      originalHours: entry.originalHours ?? entry.hours,
    })
    if (!updated) throw new NotFoundError('Time entry not found')
    return serializeTimeEntry(updated)
  }

  if (entry.status === 'amended') {
    const updated = await timeEntriesRepo.update(db, entry.id, {
      ...baseFields,
      amendedAt: new Date(),
      amendedBy: callerId,
      // originalHours preserved (populate-once rule)
    })
    if (!updated) throw new NotFoundError('Time entry not found')
    return serializeTimeEntry(updated)
  }

  const updated = await timeEntriesRepo.update(db, entry.id, baseFields)
  if (!updated) throw new NotFoundError('Time entry not found')
  return serializeTimeEntry(updated)
}

export async function updateTimeEntry(
  callerId: string,
  callerRole: string,
  id: string,
  data: UpdateTimeEntryBody,
) {
  const entry = await timeEntriesRepo.findById(db, id)
  if (!entry) throw new NotFoundError('Time entry not found')

  return callerRole === 'manager'
    ? editAsManager(callerId, entry, data)
    : editAsEmployee(callerId, entry, data)
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
  return serializeTimeEntry(updated)
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
  return serializeTimeEntry(updated)
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
