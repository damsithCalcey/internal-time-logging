import { countDistinct, eq, sql } from 'drizzle-orm'
import type { db } from '../client.js'
import { projects, tasks, userProjects, type NewProject, type Project } from '../schema.js'
import type { Tx } from '../tx.js'

type DB = Tx | typeof db

export const findById = (d: DB, id: string): Promise<Project | null> =>
  d
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .then((r) => r[0] ?? null)

export const findAll = (d: DB): Promise<Project[]> => d.select().from(projects)

export const findByNameCaseInsensitive = (d: DB, name: string): Promise<Project | null> =>
  d
    .select()
    .from(projects)
    .where(sql`lower(${projects.name}) = lower(${name})`)
    .then((r) => r[0] ?? null)

export const insert = (d: DB, data: NewProject): Promise<Project> =>
  d
    .insert(projects)
    .values(data)
    .returning()
    .then((r) => r[0]!)

export const update = (
  d: DB,
  id: string,
  data: Partial<Omit<NewProject, 'id' | 'createdAt' | 'createdBy'>>,
): Promise<Project | null> =>
  d
    .update(projects)
    .set(data)
    .where(eq(projects.id, id))
    .returning()
    .then((r) => r[0] ?? null)

export const listWithCounts = (d: DB) =>
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

export const listForTimeEntry = (d: DB) =>
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

export const countAll = (d: DB): Promise<number> =>
  d
    .select({ count: countDistinct(projects.id) })
    .from(projects)
    .then((r) => Number(r[0]?.count ?? 0))
