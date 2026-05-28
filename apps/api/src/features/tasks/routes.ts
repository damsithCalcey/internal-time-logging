import type { AppEnv } from '@/shared/auth.js'
import { requireRole } from '@/shared/auth.js'
import { zValidator } from '@hono/zod-validator'
import { CreateTaskBodySchema, UpdateTaskBodySchema } from '@repo/shared-types'
import { Hono } from 'hono'
import * as service from './service.js'

const taskRoutes = new Hono<AppEnv>()

// GET /projects/:id/tasks — any authenticated user (needed for time-entry project+task selection)
taskRoutes.get('/projects/:id/tasks', async (c) => {
  const projectId = c.req.param('id')
  const tasks = await service.listTasks(projectId)
  return c.json(tasks)
})

// POST /projects/:id/tasks — manager only
taskRoutes.post(
  '/projects/:id/tasks',
  requireRole('manager'),
  zValidator('json', CreateTaskBodySchema),
  async (c) => {
    const projectId = c.req.param('id')
    const body = c.req.valid('json')
    const task = await service.createTask(projectId, body)
    return c.json(task, 201)
  },
)

// PATCH /tasks/:id — manager only
taskRoutes.patch(
  '/tasks/:id',
  requireRole('manager'),
  zValidator('json', UpdateTaskBodySchema),
  async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const task = await service.updateTask(id, body)
    return c.json(task)
  },
)

export default taskRoutes
