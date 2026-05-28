import type * as timeEntriesRepo from './repositories/time-entries.js'
import type { TimeEntry } from './schema.js'

type EnrichedRow = Awaited<ReturnType<typeof timeEntriesRepo.findEnrichedForLog>>[number]

export function serializeTimeEntry(entry: TimeEntry) {
  return {
    ...entry,
    hours: parseFloat(entry.hours),
    originalHours: entry.originalHours != null ? parseFloat(entry.originalHours) : null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    amendedAt: entry.amendedAt?.toISOString() ?? null,
  }
}

export function serializeEnrichedEntry(row: EnrichedRow) {
  return {
    ...row,
    hours: parseFloat(row.hours),
    originalHours: row.originalHours != null ? parseFloat(row.originalHours) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    amendedAt: row.amendedAt?.toISOString() ?? null,
  }
}
