import { db } from '@/db/client.js'
import { projectsRepo, tasksRepo } from '@/db/repositories/index.js'
import { serializeTask } from '@/db/serializers.js'
import { ConflictError, NotFoundError } from '@/shared/errors.js'
import type { CreateTaskBody, UpdateTaskBody } from '@repo/shared-types'

export async function createTask(projectId: string, data: CreateTaskBody) {
  const project = await projectsRepo.findById(db, projectId)
  if (!project) throw new NotFoundError('Project not found')

  const existing = await tasksRepo.findByNameCaseInsensitive(db, projectId, data.name)
  if (existing)
    throw new ConflictError(
      'A task with this name already exists in this project',
      'task-name-conflict',
    )

  const task = await tasksRepo.insert(db, { projectId, name: data.name })
  return serializeTask(task)
}

export async function listTasks(projectId: string) {
  const project = await projectsRepo.findById(db, projectId)
  if (!project) throw new NotFoundError('Project not found')

  const all = await tasksRepo.findByProject(db, projectId)
  return all.map(serializeTask)
}

export async function updateTask(id: string, data: UpdateTaskBody) {
  const task = await tasksRepo.findById(db, id)
  if (!task) throw new NotFoundError('Task not found')

  if (data.name !== undefined && data.name.toLowerCase() !== task.name.toLowerCase()) {
    const existing = await tasksRepo.findByNameCaseInsensitive(db, task.projectId, data.name)
    if (existing)
      throw new ConflictError(
        'A task with this name already exists in this project',
        'task-name-conflict',
      )
  }

  const updated = await tasksRepo.update(db, id, {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
  })
  if (!updated) throw new NotFoundError('Task not found')
  return serializeTask(updated)
}
