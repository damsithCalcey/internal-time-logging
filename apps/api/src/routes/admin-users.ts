import { requireRole, type AppEnv } from '@/shared/auth.js'
import { MethodNotAllowedError } from '@/shared/errors.js'
import * as commands from '@/useCases/users/commands.js'
import * as queries from '@/useCases/users/queries.js'
import { zValidator } from '@hono/zod-validator'
import { CreateUserBodySchema, UpdateUserBodySchema } from '@repo/shared-types'
import { Hono } from 'hono'
import { serializeUser } from './presenters.js'

const adminUsersRoutes = new Hono<AppEnv>()

adminUsersRoutes.get('/admin/users', requireRole('manager'), async (c) => {
  const users = await queries.listUsers()
  return c.json(users.map(serializeUser))
})

adminUsersRoutes.post(
  '/admin/users',
  requireRole('manager'),
  zValidator('json', CreateUserBodySchema),
  async (c) => {
    const caller = c.get('user')
    const body = c.req.valid('json')
    const user = await commands.createUser(caller.id, body)
    return c.json(serializeUser(user), 201)
  },
)

// Hard delete is blocked per BRD §5.3
adminUsersRoutes.delete('/admin/users/:id', requireRole('manager'), (_) => {
  throw new MethodNotAllowedError('Hard delete of users is not permitted. Use deactivate instead.')
})

adminUsersRoutes.patch(
  '/admin/users/:id',
  requireRole('manager'),
  zValidator('json', UpdateUserBodySchema),
  async (c) => {
    const caller = c.get('user')
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const updated = await commands.updateUser(caller.id, id, body)
    return c.json(serializeUser(updated))
  },
)

adminUsersRoutes.post('/admin/users/:id/deactivate', requireRole('manager'), async (c) => {
  const id = c.req.param('id')
  await commands.deactivate(id)
  return c.body(null, 204)
})

adminUsersRoutes.post('/admin/users/:id/reactivate', requireRole('manager'), async (c) => {
  const id = c.req.param('id')
  await commands.reactivate(id)
  return c.body(null, 204)
})

export default adminUsersRoutes
