import { type AppEnv } from '@/shared/auth.js'
import * as commands from '@/useCases/time-entries/commands.js'
import * as queries from '@/useCases/time-entries/queries.js'
import { zValidator } from '@hono/zod-validator'
import { CreateTimeEntryBodySchema, UpdateTimeEntryBodySchema } from '@repo/shared-types'
import { Hono } from 'hono'
import { serializeEnrichedEntry, serializeTimeEntry } from './presenters.js'

const timeEntriesRoutes = new Hono<AppEnv>()

// GET /time-entries?user=<id>&date=<YYYY-MM-DD>
timeEntriesRoutes.get('/', async (c) => {
  const user = c.get('user')
  const userId = c.req.query('user')
  const date = c.req.query('date')
  const entries = await queries.listForUser(user.id, user.role, userId, date)
  return c.json(entries.map(serializeTimeEntry))
})

// GET /time-entries/daily?date=YYYY-MM-DD&userId=<id?>
// Registered before /:id so the literal segment matches first
timeEntriesRoutes.get('/daily', async (c) => {
  const user = c.get('user')
  const date = c.req.query('date')
  const userId = c.req.query('userId')
  if (!date) return c.json({ error: 'date query param is required' }, 400)
  const entries = await queries.getDailyEntries(user.id, user.role, date, userId)
  return c.json(entries.map(serializeEnrichedEntry))
})

// GET /time-entries/weekly?week=YYYY-Www&userId=<id?>
timeEntriesRoutes.get('/weekly', async (c) => {
  const user = c.get('user')
  const week = c.req.query('week')
  const userId = c.req.query('userId')
  if (!week) return c.json({ error: 'week query param is required' }, 400)
  const entries = await queries.getWeeklyEntries(user.id, user.role, week, userId)
  return c.json(entries.map(serializeEnrichedEntry))
})

// GET /time-entries/:id
timeEntriesRoutes.get('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const entry = await queries.getEntry(user.id, user.role, id)
  return c.json(serializeTimeEntry(entry))
})

// POST /time-entries
timeEntriesRoutes.post('/', zValidator('json', CreateTimeEntryBodySchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')
  const entry = await commands.createTimeEntry(user.id, user.role, body)
  return c.json(serializeTimeEntry(entry), 201)
})

// PATCH /time-entries/:id
timeEntriesRoutes.patch('/:id', zValidator('json', UpdateTimeEntryBodySchema), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = c.req.valid('json')
  const entry = await commands.updateTimeEntry(user.id, user.role, id, body)
  return c.json(serializeTimeEntry(entry))
})

// POST /time-entries/:id/submit
timeEntriesRoutes.post('/:id/submit', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const entry = await commands.submitEntry(user.id, user.role, id)
  return c.json(serializeTimeEntry(entry))
})

// POST /time-entries/:id/withdraw
timeEntriesRoutes.post('/:id/withdraw', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const entry = await commands.withdrawEntry(user.id, user.role, id)
  return c.json(serializeTimeEntry(entry))
})

export default timeEntriesRoutes
