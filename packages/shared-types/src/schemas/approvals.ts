import { z } from 'zod'
import { TimeEntrySchema } from './time-entries.js'

export const RejectBodySchema = z.object({
  note: z.string().trim().min(1, 'Rejection note is required'),
})
export type RejectBody = z.infer<typeof RejectBodySchema>

// TimeEntry extended with joined display names for the approval queue view
export const ApprovalQueueItemSchema = TimeEntrySchema.extend({
  userName: z.string(),
  projectName: z.string(),
  taskName: z.string(),
  amendedByName: z.string().nullable(),
})
export type ApprovalQueueItem = z.infer<typeof ApprovalQueueItemSchema>
