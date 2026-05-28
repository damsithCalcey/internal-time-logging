import type { TimeEntry } from './schema.js'

type EnrichedRow = {
  id: string
  userId: string
  projectId: string
  taskId: string
  entryDate: string
  hours: string
  notes: string | null
  status: TimeEntry['status']
  managerNote: string | null
  amendedAt: Date | null
  amendedBy: string | null
  originalHours: string | null
  createdAt: Date
  updatedAt: Date
  userName: string
  projectName: string
  taskName: string
  amendedByName: string | null
}

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
