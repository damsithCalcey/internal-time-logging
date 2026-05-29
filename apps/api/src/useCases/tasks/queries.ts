import { db } from '@/db/client.js'
import { projectsRepo, tasksRepo } from '@/db/repositories/index.js'
import { NotFoundError } from '@/shared/errors.js'

export async function listTasks(projectId: string) {
  const project = await projectsRepo.findById(db, projectId)
  if (!project) throw new NotFoundError('Project not found')
  return tasksRepo.findByProject(db, projectId)
}
