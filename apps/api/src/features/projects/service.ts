import { db } from '@/db/client.js'
import * as projectsRepo from '@/db/repositories/projects.js'
import * as tasksRepo from '@/db/repositories/tasks.js'
import * as userProjectsRepo from '@/db/repositories/user-projects.js'
import {
  serializeMember,
  serializeProject,
  serializeProjectListRow,
  serializeTask,
  serializeUserProject,
} from '@/db/serializers.js'
import { ConflictError, NotFoundError } from '@/shared/errors.js'
import type { CreateProjectBody, UpdateProjectBody } from '@repo/shared-types'

export async function createProject(callerId: string, data: CreateProjectBody) {
  const existing = await projectsRepo.findByNameCaseInsensitive(db, data.name)
  if (existing)
    throw new ConflictError('A project with this name already exists', 'project-name-conflict')
  return projectsRepo.insert(db, {
    name: data.name,
    description: data.description ?? null,
    createdBy: callerId,
  })
}

export async function listProjects() {
  const rows = await projectsRepo.listWithCounts(db)
  return rows.map(serializeProjectListRow)
}

export async function getProjectDetail(id: string) {
  const project = await projectsRepo.findById(db, id)
  if (!project) throw new NotFoundError('Project not found')

  const [allTasks, memberRows] = await Promise.all([
    tasksRepo.findByProject(db, id),
    userProjectsRepo.findByProjectWithUsers(db, id),
  ])

  return {
    ...serializeProject(project),
    tasks: allTasks.map(serializeTask),
    members: memberRows.map(serializeMember),
  }
}

export async function updateProject(id: string, data: UpdateProjectBody) {
  const project = await projectsRepo.findById(db, id)
  if (!project) throw new NotFoundError('Project not found')

  if (data.name !== undefined && data.name.toLowerCase() !== project.name.toLowerCase()) {
    const existing = await projectsRepo.findByNameCaseInsensitive(db, data.name)
    if (existing)
      throw new ConflictError('A project with this name already exists', 'project-name-conflict')
  }

  const updated = await projectsRepo.update(db, id, {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.description !== undefined && { description: data.description }),
  })
  if (!updated) throw new NotFoundError('Project not found')
  return serializeProject(updated)
}

export async function assignUser(projectId: string, userId: string, assignedBy: string) {
  const project = await projectsRepo.findById(db, projectId)
  if (!project) throw new NotFoundError('Project not found')

  const existing = await userProjectsRepo.findOne(db, userId, projectId)
  if (existing)
    throw new ConflictError('User is already assigned to this project', 'user-already-assigned')

  const assignment = await userProjectsRepo.insert(db, { userId, projectId, assignedBy })
  return serializeUserProject(assignment)
}

export async function unassignUser(projectId: string, userId: string) {
  const project = await projectsRepo.findById(db, projectId)
  if (!project) throw new NotFoundError('Project not found')
  await userProjectsRepo.remove(db, userId, projectId)
}

// Accessible to any authenticated user — for time-entry dropdowns (Stage 4+)
// Returns only projects that have at least one active task.
// For employees, further filtered to only projects they're assigned to.
export async function listProjectsForTimeEntry(
  callerId: string,
  callerRole: string,
  forUserId?: string,
) {
  const targetUserId = callerRole === 'manager' && forUserId ? forUserId : callerId

  const rows = await projectsRepo.listForTimeEntry(db)

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
    projectsRepo.countAll(db),
    tasksRepo.countActive(db),
    userProjectsRepo.countDistinctUsers(db),
  ])
  return { projectCount, taskCount, memberCount }
}
