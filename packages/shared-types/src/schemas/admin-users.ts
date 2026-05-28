import { z } from 'zod'
import { UserRole } from './common.js'

// ── Request bodies ────────────────────────────────────────────────

export const CreateUserBodySchema = z.object({
  email: z.string().email('Invalid email').toLowerCase().trim(),
  fullName: z.string().min(1, 'Full name is required').max(200).trim(),
  role: UserRole.default('employee'),
  managerId: z.string().uuid().nullable().optional(),
})
export type CreateUserBody = z.infer<typeof CreateUserBodySchema>

export const UpdateUserBodySchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(200).trim().optional(),
  role: UserRole.optional(),
  managerId: z.string().uuid().nullable().optional(),
})
export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>

// ── Response shapes ───────────────────────────────────────────────

export const UserDetailSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  fullName: z.string(),
  role: UserRole,
  managerId: z.string().uuid().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type UserDetail = z.infer<typeof UserDetailSchema>
