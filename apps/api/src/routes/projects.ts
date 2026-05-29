import { requireRole, type AppEnv } from '@/shared/auth.js'
import * as projectCommands from '@/useCases/projects/commands.js'
import * as projectQueries from '@/useCases/projects/queries.js'
import * as taskCommands from '@/useCases/tasks/commands.js'
import * as taskQueries from '@/useCases/tasks/queries.js'
import { zValidator } from '@hono/zod-validator'
import {
  AssignUserBodySchema,
  CreateProjectBodySchema,
  CreateTaskBodySchema,
  UpdateProjectBodySchema,
  UpdateTaskBodySchema,
} from '@repo/shared-types'
import { Hono } from 'hono'
import {
  serializeMember,
  serializeProject,
  serializeProjectListRow,
  serializeTask,
  serializeUserProject,
} from './presenters.js'

const projectRoutes = new Hono<AppEnv>()

// GET /projects — manager admin list with task/member counts
// GET /projects?for=time-entry — any authenticated user (for dropdowns)
projectRoutes.get('/', async (c) => {
  const user = c.get('user')
  const forParam = c.req.query('for')
  const userParam = c.req.query('user')

  if (forParam === 'time-entry') {
    const list = await projectQueries.listProjectsForTimeEntry(user.id, user.role, userParam)
    return c.json(list)
  }

  if (user.role !== 'manager') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const list = await projectQueries.listProjects()
  return c.json(list.map(serializeProjectListRow))
})

projectRoutes.get('/stats', requireRole('manager'), async (c) => {
  const stats = await projectQueries.getStats()
  return c.json(stats)
})

projectRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const { project, tasks, members } = await projectQueries.getProjectDetail(id)
  return c.json({
    ...serializeProject(project),
    tasks: tasks.map(serializeTask),
    members: members.map(serializeMember),
  })
})

projectRoutes.post(
  '/',
  requireRole('manager'),
  zValidator('json', CreateProjectBodySchema),
  async (c) => {
    const user = c.get('user')
    const body = c.req.valid('json')
    const project = await projectCommands.createProject(user.id, body)
    return c.json(serializeProject(project), 201)
  },
)

projectRoutes.patch(
  '/:id',
  requireRole('manager'),
  zValidator('json', UpdateProjectBodySchema),
  async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const project = await projectCommands.updateProject(id, body)
    return c.json(serializeProject(project))
  },
)

projectRoutes.post(
  '/:id/assignments',
  requireRole('manager'),
  zValidator('json', AssignUserBodySchema),
  async (c) => {
    const projectId = c.req.param('id')
    const user = c.get('user')
    const { userId } = c.req.valid('json')
    const assignment = await projectCommands.assignUser(projectId, userId, user.id)
    return c.json(serializeUserProject(assignment), 201)
  },
)

projectRoutes.delete('/:id/assignments/:userId', requireRole('manager'), async (c) => {
  const projectId = c.req.param('id')
  const userId = c.req.param('userId')
  await projectCommands.unassignUser(projectId, userId)
  return c.body(null, 204)
})

// GET /projects/:id/tasks — any authenticated user (needed for time-entry project+task selection)
projectRoutes.get('/:id/tasks', async (c) => {
  const projectId = c.req.param('id')
  const tasks = await taskQueries.listTasks(projectId)
  return c.json(tasks.map(serializeTask))
})

projectRoutes.post(
  '/:id/tasks',
  requireRole('manager'),
  zValidator('json', CreateTaskBodySchema),
  async (c) => {
    const projectId = c.req.param('id')
    const body = c.req.valid('json')
    const task = await taskCommands.createTask(projectId, body)
    return c.json(serializeTask(task), 201)
  },
)

projectRoutes.patch(
  '/:projectId/tasks/:taskId',
  requireRole('manager'),
  zValidator('json', UpdateTaskBodySchema),
  async (c) => {
    const taskId = c.req.param('taskId')
    const body = c.req.valid('json')
    const task = await taskCommands.updateTask(taskId, body)
    return c.json(serializeTask(task))
  },
)

export default projectRoutes
