import type { AppEnv } from '@/shared/auth.js'
import { requireRole } from '@/shared/auth.js'
import { zValidator } from '@hono/zod-validator'
import { RejectBodySchema } from '@repo/shared-types'
import { Hono } from 'hono'
import { z } from 'zod'
import * as approvalsService from './service.js'

const app = new Hono<AppEnv>()

// All approvals endpoints are manager-only
app.use('*', requireRole('manager'))

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

app.get('/approvals', zValidator('query', queueQuerySchema), async (c) => {
  const q = c.req.valid('query')
  const filters: Parameters<typeof approvalsService.getQueue>[0] = {}
  if (q.status !== undefined) filters.status = q.status
  if (q.userId !== undefined) filters.userId = q.userId
  if (q.from !== undefined) filters.from = q.from
  if (q.to !== undefined) filters.to = q.to
  const items = await approvalsService.getQueue(filters)
  return c.json(items)
})

app.post('/approvals/:id/approve', async (c) => {
  const { id } = c.req.param()
  const manager = c.get('user')
  const entry = await approvalsService.approveEntry(manager.id, id)
  return c.json(entry)
})

app.post(
  '/approvals/:id/reject',
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
    const entry = await approvalsService.rejectEntry(manager.id, id, note)
    return c.json(entry)
  },
)

export default app
