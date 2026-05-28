import type { AppEnv } from '@/shared/auth.js'
import { requireRole } from '@/shared/auth.js'
import { MethodNotAllowedError } from '@/shared/errors.js'
import { zValidator } from '@hono/zod-validator'
import { CreateUserBodySchema, UpdateUserBodySchema } from '@repo/shared-types'
import { Hono } from 'hono'
import * as service from './service.js'

const adminUsersRoutes = new Hono<AppEnv>()

// GET /admin/users — manager only
adminUsersRoutes.get('/admin/users', requireRole('manager'), async (c) => {
  const users = await service.listUsers()
  return c.json(users)
})

// POST /admin/users — manager only
adminUsersRoutes.post(
  '/admin/users',
  requireRole('manager'),
  zValidator('json', CreateUserBodySchema),
  async (c) => {
    const caller = c.get('user')
    const body = c.req.valid('json')
    const user = await service.createUser(caller.id, body)
    return c.json(user, 201)
  },
)

// DELETE /admin/users/:id — 405: hard delete is blocked per BRD §5.3
adminUsersRoutes.delete('/admin/users/:id', requireRole('manager'), (_) => {
  throw new MethodNotAllowedError('Hard delete of users is not permitted. Use deactivate instead.')
})

// PATCH /admin/users/:id — manager only
adminUsersRoutes.patch(
  '/admin/users/:id',
  requireRole('manager'),
  zValidator('json', UpdateUserBodySchema),
  async (c) => {
    const caller = c.get('user')
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const updated = await service.updateUser(caller.id, id, body)
    return c.json(updated)
  },
)

// POST /admin/users/:id/deactivate — manager only
adminUsersRoutes.post('/admin/users/:id/deactivate', requireRole('manager'), async (c) => {
  const id = c.req.param('id')
  await service.deactivate(id)
  return c.body(null, 204)
})

// POST /admin/users/:id/reactivate — manager only
adminUsersRoutes.post('/admin/users/:id/reactivate', requireRole('manager'), async (c) => {
  const id = c.req.param('id')
  await service.reactivate(id)
  return c.body(null, 204)
})

export default adminUsersRoutes
