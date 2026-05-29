import { countDistinct, eq, sql } from 'drizzle-orm'
import type { db } from '../client.js'
import { projects, tasks, userProjects, type NewProject, type Project } from '../schema.js'
export type { Project } from '../schema.js'
import type { Tx } from '../tx.js'

type DB = Tx | typeof db

export type ProjectListRow = {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  taskCount: number
  memberCount: number
}

export type ProjectTaskRow = {
  id: string
  name: string
  taskId: string | null
  taskName: string | null
}

export interface ProjectsRepo {
  findById(d: DB, id: string): Promise<Project | null>
  findAll(d: DB): Promise<Project[]>
  findByNameCaseInsensitive(d: DB, name: string): Promise<Project | null>
  insert(d: DB, data: NewProject): Promise<Project>
  update(
    d: DB,
    id: string,
    data: Partial<Omit<NewProject, 'id' | 'createdAt' | 'createdBy'>>,
  ): Promise<Project | null>
  listWithCounts(d: DB): Promise<ProjectListRow[]>
  listForTimeEntry(d: DB): Promise<ProjectTaskRow[]>
  countAll(d: DB): Promise<number>
}

export const findById: ProjectsRepo['findById'] = (d, id) =>
  d
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .then((r) => r[0] ?? null)

export const findAll: ProjectsRepo['findAll'] = (d) => d.select().from(projects)

export const findByNameCaseInsensitive: ProjectsRepo['findByNameCaseInsensitive'] = (d, name) =>
  d
    .select()
    .from(projects)
    .where(sql`lower(${projects.name}) = lower(${name})`)
    .then((r) => r[0] ?? null)

export const insert: ProjectsRepo['insert'] = (d, data) =>
  d
    .insert(projects)
    .values(data)
    .returning()
    .then((r) => r[0]!)

export const update: ProjectsRepo['update'] = (d, id, data) =>
  d
    .update(projects)
    .set(data)
    .where(eq(projects.id, id))
    .returning()
    .then((r) => r[0] ?? null)

export const listWithCounts: ProjectsRepo['listWithCounts'] = (d) =>
  d
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
    .then((rows) => rows.map((r) => ({ ...r, taskCount: Number(r.taskCount), memberCount: Number(r.memberCount) })))

export const listForTimeEntry: ProjectsRepo['listForTimeEntry'] = (d) =>
  d
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

export const countAll: ProjectsRepo['countAll'] = (d) =>
  d
    .select({ count: countDistinct(projects.id) })
    .from(projects)
    .then((r) => Number(r[0]?.count ?? 0))

export const projectsRepo = {
  findById,
  findAll,
  findByNameCaseInsensitive,
  insert,
  update,
  listWithCounts,
  listForTimeEntry,
  countAll,
} satisfies ProjectsRepo
