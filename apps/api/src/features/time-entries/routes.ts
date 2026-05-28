import { zValidator } from '@hono/zod-validator'
import type { AppEnv } from '@/shared/auth.js'
import { CreateTimeEntryBodySchema, UpdateTimeEntryBodySchema } from '@repo/shared-types'
import { Hono } from 'hono'
import * as service from './service.js'

const timeEntriesRoutes = new Hono<AppEnv>()

// GET /time-entries?user=<id>&date=<YYYY-MM-DD>
timeEntriesRoutes.get('/time-entries', async (c) => {
  const user = c.get('user')
  const userId = c.req.query('user')
  const date = c.req.query('date')
  const entries = await service.listForUser(user.id, user.role, userId, date)
  return c.json(entries)
})

// GET /time-entries/:id
timeEntriesRoutes.get('/time-entries/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const entry = await service.getEntry(user.id, user.role, id)
  return c.json(entry)
})

// POST /time-entries
timeEntriesRoutes.post(
  '/time-entries',
  zValidator('json', CreateTimeEntryBodySchema),
  async (c) => {
    const user = c.get('user')
    const body = c.req.valid('json')
    const entry = await service.createTimeEntry(user.id, user.role, body)
    return c.json(entry, 201)
  },
)

// PATCH /time-entries/:id
timeEntriesRoutes.patch(
  '/time-entries/:id',
  zValidator('json', UpdateTimeEntryBodySchema),
  async (c) => {
    const user = c.get('user')
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const entry = await service.updateTimeEntry(user.id, user.role, id, body)
    return c.json(entry)
  },
)

// POST /time-entries/:id/submit
timeEntriesRoutes.post('/time-entries/:id/submit', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const entry = await service.submitEntry(user.id, user.role, id)
  return c.json(entry)
})

// POST /time-entries/:id/withdraw
timeEntriesRoutes.post('/time-entries/:id/withdraw', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const entry = await service.withdrawEntry(user.id, user.role, id)
  return c.json(entry)
})

export default timeEntriesRoutes
