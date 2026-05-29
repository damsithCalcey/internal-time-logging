import { db } from '@/db/client.js'
import { timeEntriesRepo } from '@/db/repositories/index.js'
import { NotFoundError, ValidationError } from '@/shared/errors.js'

export async function getEntry(callerId: string, callerRole: string, id: string) {
  const entry = await timeEntriesRepo.findById(db, id)
  if (!entry) throw new NotFoundError('Time entry not found')
  if (callerRole !== 'manager' && entry.userId !== callerId) {
    throw new NotFoundError('Time entry not found')
  }
  return entry
}

export async function listForUser(
  callerId: string,
  callerRole: string,
  userId?: string,
  date?: string,
) {
  const targetId = callerRole === 'manager' && userId ? userId : callerId
  if (date) return timeEntriesRepo.findByUserAndDate(db, targetId, date)
  return timeEntriesRepo.findByUser(db, targetId)
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
  const targetUserId = callerRole === 'manager' ? userId : callerId
  const filters = targetUserId ? { date, userId: targetUserId } : { date }
  return timeEntriesRepo.findEnrichedForLog(db, filters)
}

export async function getWeeklyEntries(
  callerId: string,
  callerRole: string,
  week: string,
  userId?: string,
) {
  const { from, to } = parseIsoWeek(week)
  const targetUserId = callerRole === 'manager' ? userId : callerId
  const filters = targetUserId ? { from, to, userId: targetUserId } : { from, to }
  return timeEntriesRepo.findEnrichedForLog(db, filters)
}
