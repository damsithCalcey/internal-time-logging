import type { Project, ProjectListRow as RepoProjectListRow } from '@/db/repositories/projects.js'
import type { Task } from '@/db/repositories/tasks.js'
import type { EnrichedTimeEntryRow, TimeEntry } from '@/db/repositories/time-entries.js'
import type { User } from '@/db/repositories/users.js'
import type { ProjectMemberRow, UserProject } from '@/db/repositories/user-projects.js'

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

export function serializeProjectListRow(r: RepoProjectListRow) {
  return {
    ...r,
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

export function serializeMember(m: ProjectMemberRow) {
  return {
    ...m,
    assignedAt: m.assignedAt.toISOString(),
  }
}

export function serializeEnrichedEntry(row: EnrichedTimeEntryRow) {
  return {
    ...row,
    hours: parseFloat(row.hours),
    originalHours: row.originalHours != null ? parseFloat(row.originalHours) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    amendedAt: row.amendedAt?.toISOString() ?? null,
  }
}
