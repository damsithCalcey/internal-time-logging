import { requireRole, type AppEnv } from '@/shared/auth.js'
import * as commands from '@/useCases/approvals/commands.js'
import * as queries from '@/useCases/approvals/queries.js'
import { zValidator } from '@hono/zod-validator'
import { RejectBodySchema } from '@repo/shared-types'
import { Hono } from 'hono'
import { z } from 'zod'
import { serializeEnrichedEntry, serializeTimeEntry } from './presenters.js'

const approvalsRoutes = new Hono<AppEnv>()

approvalsRoutes.use('*', requireRole('manager'))

const queueQuerySchema = z.object({
  status: z.enum(['draft', 'submitted', 'approved', 'rejected', 'amended']).optional(),
  userId: z.string().uuid().optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

approvalsRoutes.get('/', zValidator('query', queueQuerySchema), async (c) => {
  const q = c.req.valid('query')
  const filters: Parameters<typeof queries.getQueue>[0] = {}
  if (q.status !== undefined) filters.status = q.status
  if (q.userId !== undefined) filters.userId = q.userId
  if (q.from !== undefined) filters.from = q.from
  if (q.to !== undefined) filters.to = q.to
  const items = await queries.getQueue(filters)
  return c.json(items.map(serializeEnrichedEntry))
})

approvalsRoutes.post('/:id/approve', async (c) => {
  const { id } = c.req.param()
  const manager = c.get('user')
  const entry = await commands.approveEntry(manager.id, id)
  return c.json(serializeTimeEntry(entry))
})

approvalsRoutes.post(
  '/:id/reject',
  zValidator('json', RejectBodySchema, (result, c) => {
    if (!result.success) {
      const first = result.error.errors[0]
      return c.json({ error: first?.message ?? 'Validation error' }, 400)
    }
  }),
  async (c) => {
    const { id } = c.req.param()
    const manager = c.get('user')
    const { note } = c.req.valid('json')
    const entry = await commands.rejectEntry(manager.id, id, note)
    return c.json(serializeTimeEntry(entry))
  },
)

export default approvalsRoutes
