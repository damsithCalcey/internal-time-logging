import { z } from 'zod'

export const UserRole = z.enum(['manager', 'employee'])
export type UserRole = z.infer<typeof UserRole>

export const TimeEntryStatus = z.enum(['draft', 'submitted', 'approved', 'rejected', 'amended'])
export type TimeEntryStatus = z.infer<typeof TimeEntryStatus>

export const TimerSessionStatus = z.enum(['active', 'stopped', 'saved', 'discarded'])
export type TimerSessionStatus = z.infer<typeof TimerSessionStatus>
