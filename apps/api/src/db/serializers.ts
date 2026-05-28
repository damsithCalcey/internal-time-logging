import type { Project, Task, TimeEntry, User, UserProject } from './schema.js'

type EnrichedRow = {
  id: string
  userId: string
  projectId: string
  taskId: string
  entryDate: string
  hours: string
  notes: string | null
  status: TimeEntry['status']
  managerNote: string | null
  amendedAt: Date | null
  amendedBy: string | null
  originalHours: string | null
  createdAt: Date
  updatedAt: Date
  userName: string
  projectName: string
  taskName: string
  amendedByName: string | null
}

export function serializeTimeEntry(entry: TimeEntry) {
  return {
    ...entry,
    hours: parseFloat(entry.hours),
    originalHours: entry.originalHours != null ? parseFloat(entry.originalHours) : null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    amendedAt: entry.amendedAt?.toISOString() ?? null,
  }
}

export function serializeProject(p: Project) {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}

type ProjectListRow = {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  taskCount: number
  memberCount: number
}

export function serializeProjectListRow(r: ProjectListRow) {
  return {
    ...r,
    taskCount: Number(r.taskCount),
    memberCount: Number(r.memberCount),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

export function serializeTask(t: Task) {
  return {
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }
}

export function serializeUser(u: User) {
  return {
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }
}

export function serializeUserProject(a: UserProject) {
  return {
    ...a,
    assignedAt: a.assignedAt.toISOString(),
  }
}

type MemberRow = {
  userId: string
  fullName: string
  email: string
  role: User['role']
  assignedAt: Date
}

export function serializeMember(m: MemberRow) {
  return {
    ...m,
    assignedAt: m.assignedAt.toISOString(),
  }
}

export function serializeEnrichedEntry(row: EnrichedRow) {
  return {
    ...row,
    hours: parseFloat(row.hours),
    originalHours: row.originalHours != null ? parseFloat(row.originalHours) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    amendedAt: row.amendedAt?.toISOString() ?? null,
  }
}
