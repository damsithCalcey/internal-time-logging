import { and, countDistinct, eq, sql } from 'drizzle-orm'
import type { db } from '../client.js'
import { tasks, type NewTask, type Task } from '../schema.js'
export type { Task } from '../schema.js'
import type { Tx } from '../tx.js'

type DB = Tx | typeof db

export interface TasksRepo {
  findById(d: DB, id: string): Promise<Task | null>
  findByProject(d: DB, projectId: string): Promise<Task[]>
  findActiveByProject(d: DB, projectId: string): Promise<Task[]>
  findByNameCaseInsensitive(d: DB, projectId: string, name: string): Promise<Task | null>
  insert(d: DB, data: NewTask): Promise<Task>
  update(
    d: DB,
    id: string,
    data: Partial<Omit<NewTask, 'id' | 'projectId' | 'createdAt'>>,
  ): Promise<Task | null>
  countActive(d: DB): Promise<number>
}

export const findById: TasksRepo['findById'] = (d, id) =>
  d
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .then((r) => r[0] ?? null)

export const findByProject: TasksRepo['findByProject'] = (d, projectId) =>
  d.select().from(tasks).where(eq(tasks.projectId, projectId))

export const findActiveByProject: TasksRepo['findActiveByProject'] = (d, projectId) =>
  d
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.isActive, true)))

export const findByNameCaseInsensitive: TasksRepo['findByNameCaseInsensitive'] = (
  d,
  projectId,
  name,
) =>
  d
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), sql`lower(${tasks.name}) = lower(${name})`))
    .then((r) => r[0] ?? null)

export const insert: TasksRepo['insert'] = (d, data) =>
  d
    .insert(tasks)
    .values(data)
    .returning()
    .then((r) => r[0]!)

export const update: TasksRepo['update'] = (d, id, data) =>
  d
    .update(tasks)
    .set(data)
    .where(eq(tasks.id, id))
    .returning()
    .then((r) => r[0] ?? null)

export const countActive: TasksRepo['countActive'] = (d) =>
  d
    .select({ count: countDistinct(tasks.id) })
    .from(tasks)
    .where(eq(tasks.isActive, true))
    .then((r) => Number(r[0]?.count ?? 0))

export const tasksRepo = {
  findById,
  findByProject,
  findActiveByProject,
  findByNameCaseInsensitive,
  insert,
  update,
  countActive,
} satisfies TasksRepo
