import { db } from '@/db/client.js'
import { projectsRepo, tasksRepo, userProjectsRepo } from '@/db/repositories/index.js'
import { NotFoundError } from '@/shared/errors.js'

export async function listProjects() {
  return projectsRepo.listWithCounts(db)
}

export async function getProjectDetail(id: string) {
  const project = await projectsRepo.findById(db, id)
  if (!project) throw new NotFoundError('Project not found')

  const [tasks, members] = await Promise.all([
    tasksRepo.findByProject(db, id),
    userProjectsRepo.findByProjectWithUsers(db, id),
  ])

  return { project, tasks, members }
}

export async function listProjectsForTimeEntry(
  callerId: string,
  callerRole: string,
  forUserId?: string,
) {
  const targetUserId = callerRole === 'manager' && forUserId ? forUserId : callerId
  const rows = await projectsRepo.listForTimeEntry(db)

  let allowedProjectIds: Set<string> | null = null
  if (callerRole !== 'manager') {
    const assignments = await userProjectsRepo.findByUser(db, targetUserId)
    allowedProjectIds = new Set(assignments.map((a) => a.projectId))
  }

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
