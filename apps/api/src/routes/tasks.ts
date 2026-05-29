import { requireRole, type AppEnv } from '@/shared/auth.js'
import * as commands from '@/useCases/tasks/commands.js'
import * as queries from '@/useCases/tasks/queries.js'
import { zValidator } from '@hono/zod-validator'
import { CreateTaskBodySchema, UpdateTaskBodySchema } from '@repo/shared-types'
import { Hono } from 'hono'
import { serializeTask } from './presenters.js'

const taskRoutes = new Hono<AppEnv>()

// GET /projects/:id/tasks — any authenticated user (needed for time-entry project+task selection)
taskRoutes.get('/projects/:id/tasks', async (c) => {
  const projectId = c.req.param('id')
  const tasks = await queries.listTasks(projectId)
  return c.json(tasks.map(serializeTask))
})

taskRoutes.post(
  '/projects/:id/tasks',
  requireRole('manager'),
  zValidator('json', CreateTaskBodySchema),
  async (c) => {
    const projectId = c.req.param('id')
    const body = c.req.valid('json')
    const task = await commands.createTask(projectId, body)
    return c.json(serializeTask(task), 201)
  },
)

taskRoutes.patch(
  '/tasks/:id',
  requireRole('manager'),
  zValidator('json', UpdateTaskBodySchema),
  async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const task = await commands.updateTask(id, body)
    return c.json(serializeTask(task))
  },
)

export default taskRoutes
