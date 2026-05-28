import { db } from '@/db/client.js'
import * as projectsRepo from '@/db/repositories/projects.js'
import * as tasksRepo from '@/db/repositories/tasks.js'
import * as userProjectsRepo from '@/db/repositories/user-projects.js'
import { projects, tasks, userProjects, users } from '@/db/schema.js'
import { ConflictError, NotFoundError } from '@/shared/errors.js'
import type { CreateProjectBody, UpdateProjectBody } from '@repo/shared-types'
import { countDistinct, eq, sql } from 'drizzle-orm'

export async function createProject(callerId: string, data: CreateProjectBody) {
  const existing = await projectsRepo.findByNameCaseInsensitive(db, data.name)
  if (existing) throw new ConflictError('A project with this name already exists', 'project-name-conflict')
  return projectsRepo.insert(db, {
    name: data.name,
    description: data.description ?? null,
    createdBy: callerId,
  })
}

export async function listProjects() {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      taskCount: countDistinct(tasks.id),
      memberCount: countDistinct(userProjects.userId),
    })
    .from(projects)
    .leftJoin(tasks, eq(tasks.projectId, projects.id))
    .leftJoin(userProjects, eq(userProjects.projectId, projects.id))
    .groupBy(projects.id, projects.name, projects.description, projects.createdAt, projects.updatedAt)
    .orderBy(sql`lower(${projects.name})`)

  return rows.map((r) => ({
    ...r,
    taskCount: Number(r.taskCount),
    memberCount: Number(r.memberCount),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))
}

export async function getProjectDetail(id: string) {
  const project = await projectsRepo.findById(db, id)
  if (!project) throw new NotFoundError('Project not found')

  const [allTasks, memberRows] = await Promise.all([
    tasksRepo.findByProject(db, id),
    db
      .select({
        userId: userProjects.userId,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        assignedAt: userProjects.assignedAt,
      })
      .from(userProjects)
      .innerJoin(users, eq(users.id, userProjects.userId))
      .where(eq(userProjects.projectId, id))
      .orderBy(users.fullName),
  ])

  return {
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    tasks: allTasks.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
    members: memberRows.map((m) => ({
      ...m,
      assignedAt: m.assignedAt.toISOString(),
    })),
  }
}

export async function updateProject(id: string, data: UpdateProjectBody) {
  const project = await projectsRepo.findById(db, id)
  if (!project) throw new NotFoundError('Project not found')

  if (data.name !== undefined && data.name.toLowerCase() !== project.name.toLowerCase()) {
    const existing = await projectsRepo.findByNameCaseInsensitive(db, data.name)
    if (existing) throw new ConflictError('A project with this name already exists', 'project-name-conflict')
  }

  const updated = await projectsRepo.update(db, id, {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.description !== undefined && { description: data.description }),
  })
  if (!updated) throw new NotFoundError('Project not found')
  return {
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

export async function assignUser(projectId: string, userId: string, assignedBy: string) {
  const project = await projectsRepo.findById(db, projectId)
  if (!project) throw new NotFoundError('Project not found')

  const existing = await userProjectsRepo.findOne(db, userId, projectId)
  if (existing) throw new ConflictError('User is already assigned to this project', 'user-already-assigned')

  const assignment = await userProjectsRepo.insert(db, { userId, projectId, assignedBy })
  return { ...assignment, assignedAt: assignment.assignedAt.toISOString() }
}

export async function unassignUser(projectId: string, userId: string) {
  const project = await projectsRepo.findById(db, projectId)
  if (!project) throw new NotFoundError('Project not found')
  await userProjectsRepo.remove(db, userId, projectId)
}

// Accessible to any authenticated user — for time-entry dropdowns (Stage 4+)
// Returns only projects that have at least one active task.
// For employees, further filtered to only projects they're assigned to.
export async function listProjectsForTimeEntry(callerId: string, callerRole: string, forUserId?: string) {
  const targetUserId = callerRole === 'manager' && forUserId ? forUserId : callerId

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      taskId: tasks.id,
      taskName: tasks.name,
    })
    .from(projects)
    .innerJoin(tasks, eq(tasks.projectId, projects.id))
    .where(eq(tasks.isActive, true))
    .orderBy(sql`lower(${projects.name})`, sql`lower(${tasks.name})`)

  // For employees, filter to only assigned projects
  let allowedProjectIds: Set<string> | null = null
  if (callerRole !== 'manager') {
    const assignments = await userProjectsRepo.findByUser(db, targetUserId)
    allowedProjectIds = new Set(assignments.map((a) => a.projectId))
  }

  // Group tasks by project
  const map = new Map<string, { id: string; name: string; tasks: { id: string; name: string }[] }>()
  for (const row of rows) {
    if (allowedProjectIds && !allowedProjectIds.has(row.id)) continue
    if (!map.has(row.id)) map.set(row.id, { id: row.id, name: row.name, tasks: [] })
    if (row.taskId) map.get(row.id)!.tasks.push({ id: row.taskId, name: row.taskName! })
  }

  return Array.from(map.values())
}

export async function getStats() {
  const [projectCount, taskCount, memberCount] = await Promise.all([
    db.select({ count: countDistinct(projects.id) }).from(projects).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: countDistinct(tasks.id) }).from(tasks).where(eq(tasks.isActive, true)).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: countDistinct(userProjects.userId) }).from(userProjects).then((r) => Number(r[0]?.count ?? 0)),
  ])
  return { projectCount, taskCount, memberCount }
}
