import type { AppEnv } from '@/shared/auth.js'
import * as queries from '@/useCases/users/queries.js'
import type { UserOption } from '@repo/shared-types'
import { Hono } from 'hono'

const userRoutes = new Hono<AppEnv>()

// Returns active users for pickers (assignment panel, etc.) — read-only slice
userRoutes.get('/users', async (c) => {
  const active = await queries.listActiveUsers()
  const response: UserOption[] = active.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
  }))
  return c.json(response)
})

export default userRoutes
