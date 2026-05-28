import { z } from 'zod'
import { TimeEntryStatus } from './common.js'

// ── Request bodies ────────────────────────────────────────────────

export const CreateTimeEntryBodySchema = z.object({
  userId: z.string().uuid().optional(), // manager-only: on-behalf-of
  projectId: z.string().uuid(),
  taskId: z.string().uuid(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  hours: z
    .number({ invalid_type_error: 'Hours must be a number' })
    .positive('Hours must be positive')
    .max(24, 'Hours cannot exceed 24')
    .refine((h) => Math.floor(h * 2) === h * 2, 'Hours must be in 0.5 increments'),
  notes: z.string().max(1000).trim().nullable().optional(),
})
export type CreateTimeEntryBody = z.infer<typeof CreateTimeEntryBodySchema>

export const UpdateTimeEntryBodySchema = z.object({
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  hours: z
    .number({ invalid_type_error: 'Hours must be a number' })
    .positive('Hours must be positive')
    .max(24, 'Hours cannot exceed 24')
    .refine((h) => Math.floor(h * 2) === h * 2, 'Hours must be in 0.5 increments')
    .optional(),
  notes: z.string().max(1000).trim().nullable().optional(),
})
export type UpdateTimeEntryBody = z.infer<typeof UpdateTimeEntryBodySchema>

// ── Response shapes ───────────────────────────────────────────────

export const TimeEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  projectId: z.string().uuid(),
  taskId: z.string().uuid(),
  entryDate: z.string(),
  hours: z.number(),
  notes: z.string().nullable(),
  status: TimeEntryStatus,
  managerNote: z.string().nullable(),
  amendedAt: z.string().nullable(),
  amendedBy: z.string().uuid().nullable(),
  originalHours: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type TimeEntry = z.infer<typeof TimeEntrySchema>
