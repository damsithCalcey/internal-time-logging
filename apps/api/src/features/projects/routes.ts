import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import type { AppEnv } from '@/shared/auth.js'
import { requireRole } from '@/shared/auth.js'
import {
  CreateProjectBodySchema,
  UpdateProjectBodySchema,
  AssignUserBodySchema,
} from '@repo/shared-types'
import * as service from './service.js'

const projectRoutes = new Hono<AppEnv>()

// GET /projects — manager admin list with task/member counts
// GET /projects?for=time-entry — any authenticated user (for dropdowns)
projectRoutes.get('/projects', async (c) => {
  const user = c.get('user')
  const forParam = c.req.query('for')
  const userParam = c.req.query('user')

  if (forParam === 'time-entry') {
    const list = await service.listProjectsForTimeEntry(user.id, user.role, userParam)
    return c.json(list)
  }

  if (user.role !== 'manager') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const list = await service.listProjects()
  return c.json(list)
})

// GET /projects/stats — manager only, aggregate counts
projectRoutes.get('/projects/stats', requireRole('manager'), async (c) => {
  const stats = await service.getStats()
  return c.json(stats)
})

// GET /projects/:id — any authenticated user (needed for time-entry form detail)
projectRoutes.get('/projects/:id', async (c) => {
  const id = c.req.param('id')
  const detail = await service.getProjectDetail(id)
  return c.json(detail)
})

// POST /projects — manager only
projectRoutes.post(
  '/projects',
  requireRole('manager'),
  zValidator('json', CreateProjectBodySchema),
  async (c) => {
    const user = c.get('user')
    const body = c.req.valid('json')
    const project = await service.createProject(user.id, body)
    return c.json(
      { ...project, createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt.toISOString() },
      201,
    )
  },
)

// PATCH /projects/:id — manager only
projectRoutes.patch(
  '/projects/:id',
  requireRole('manager'),
  zValidator('json', UpdateProjectBodySchema),
  async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const project = await service.updateProject(id, body)
    return c.json(project)
  },
)

// POST /projects/:id/assignments — manager only
projectRoutes.post(
  '/projects/:id/assignments',
  requireRole('manager'),
  zValidator('json', AssignUserBodySchema),
  async (c) => {
    const projectId = c.req.param('id')
    const user = c.get('user')
    const { userId } = c.req.valid('json')
    const assignment = await service.assignUser(projectId, userId, user.id)
    return c.json(assignment, 201)
  },
)

// DELETE /projects/:id/assignments/:userId — manager only
projectRoutes.delete(
  '/projects/:id/assignments/:userId',
  requireRole('manager'),
  async (c) => {
    const projectId = c.req.param('id')
    const userId = c.req.param('userId')
    await service.unassignUser(projectId, userId)
    return c.body(null, 204)
  },
)

export default projectRoutes
