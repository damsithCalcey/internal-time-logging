import { db } from '@/db/client.js'
import { timeEntriesRepo } from '@/db/repositories/index.js'
import type { TimeEntryStatus } from '@repo/shared-types'

export async function getQueue(filters: {
  status?: TimeEntryStatus
  userId?: string
  from?: string
  to?: string
}) {
  return timeEntriesRepo.findForQueue(db, filters)
}
