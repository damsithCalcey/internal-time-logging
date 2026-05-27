import { z } from 'zod'
import { UserRole } from './common.js'

export const MeResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  role: UserRole,
  isActive: z.boolean(),
})

export type MeResponse = z.infer<typeof MeResponseSchema>
