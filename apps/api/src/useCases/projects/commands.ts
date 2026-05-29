import { db } from '@/db/client.js'
import { projectsRepo, userProjectsRepo } from '@/db/repositories/index.js'
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
  return updated
}

export async function assignUser(projectId: string, userId: string, assignedBy: string) {
  const project = await projectsRepo.findById(db, projectId)
  if (!project) throw new NotFoundError('Project not found')

  const existing = await userProjectsRepo.findOne(db, userId, projectId)
  if (existing)
    throw new ConflictError('User is already assigned to this project', 'user-already-assigned')

  return userProjectsRepo.insert(db, { userId, projectId, assignedBy })
}

export async function unassignUser(projectId: string, userId: string) {
  const project = await projectsRepo.findById(db, projectId)
  if (!project) throw new NotFoundError('Project not found')
  await userProjectsRepo.remove(db, userId, projectId)
}
