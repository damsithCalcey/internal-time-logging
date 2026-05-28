import { db } from '@/db/client.js'
import { usersRepo } from '@/db/repositories/index.js'
import type { AppEnv } from '@/shared/auth.js'
import type { UserOption } from '@repo/shared-types'
import { Hono } from 'hono'

const userRoutes = new Hono<AppEnv>()

// GET /users — returns active users for pickers (assignment panel, etc.)
// Stage 4 adds admin-users for full CRUD; this is the read-only slice.
userRoutes.get('/users', async (c) => {
  const active = await usersRepo.findAllActive(db)
  const response: UserOption[] = active.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
  }))
  return c.json(response)
})

export default userRoutes
