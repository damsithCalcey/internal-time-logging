import { Hono } from 'hono'
import type { AppEnv } from '@/shared/auth.js'
import type { MeResponse } from '@repo/shared-types'

const authRoutes = new Hono<AppEnv>()

// No DB lookup — claims come directly from the verified JWT (dev plan §1.4)
authRoutes.get('/me', (c) => {
  const user = c.get('user')
  return c.json<MeResponse>({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
  })
})

export default authRoutes
