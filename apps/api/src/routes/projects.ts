import { requireRole, type AppEnv } from '@/shared/auth.js'
import * as commands from '@/useCases/projects/commands.js'
import * as queries from '@/useCases/projects/queries.js'
import { zValidator } from '@hono/zod-validator'
import {
  AssignUserBodySchema,
  CreateProjectBodySchema,
  UpdateProjectBodySchema,
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
projectRoutes.get('/projects', async (c) => {
  const user = c.get('user')
  const forParam = c.req.query('for')
  const userParam = c.req.query('user')

  if (forParam === 'time-entry') {
    const list = await queries.listProjectsForTimeEntry(user.id, user.role, userParam)
    return c.json(list)
  }

  if (user.role !== 'manager') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const list = await queries.listProjects()
  return c.json(list.map(serializeProjectListRow))
})

projectRoutes.get('/projects/stats', requireRole('manager'), async (c) => {
  const stats = await queries.getStats()
  return c.json(stats)
})

projectRoutes.get('/projects/:id', async (c) => {
  const id = c.req.param('id')
  const { project, tasks, members } = await queries.getProjectDetail(id)
  return c.json({
    ...serializeProject(project),
    tasks: tasks.map(serializeTask),
    members: members.map(serializeMember),
  })
})

projectRoutes.post(
  '/projects',
  requireRole('manager'),
  zValidator('json', CreateProjectBodySchema),
  async (c) => {
    const user = c.get('user')
    const body = c.req.valid('json')
    const project = await commands.createProject(user.id, body)
    return c.json(serializeProject(project), 201)
  },
)

projectRoutes.patch(
  '/projects/:id',
  requireRole('manager'),
  zValidator('json', UpdateProjectBodySchema),
  async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const project = await commands.updateProject(id, body)
    return c.json(serializeProject(project))
  },
)

projectRoutes.post(
  '/projects/:id/assignments',
  requireRole('manager'),
  zValidator('json', AssignUserBodySchema),
  async (c) => {
    const projectId = c.req.param('id')
    const user = c.get('user')
    const { userId } = c.req.valid('json')
    const assignment = await commands.assignUser(projectId, userId, user.id)
    return c.json(serializeUserProject(assignment), 201)
  },
)

projectRoutes.delete('/projects/:id/assignments/:userId', requireRole('manager'), async (c) => {
  const projectId = c.req.param('id')
  const userId = c.req.param('userId')
  await commands.unassignUser(projectId, userId)
  return c.body(null, 204)
})

export default projectRoutes
