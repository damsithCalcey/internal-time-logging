import { and, eq, sql } from 'drizzle-orm'
import type { db } from '../client.js'
import { tasks, type NewTask, type Task } from '../schema.js'
import type { Tx } from '../tx.js'

type DB = Tx | typeof db

export const findById = (d: DB, id: string): Promise<Task | null> =>
  d
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .then((r) => r[0] ?? null)

export const findByProject = (d: DB, projectId: string): Promise<Task[]> =>
  d.select().from(tasks).where(eq(tasks.projectId, projectId))

export const findActiveByProject = (d: DB, projectId: string): Promise<Task[]> =>
  d
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.isActive, true)))

export const findByNameCaseInsensitive = (
  d: DB,
  projectId: string,
  name: string,
): Promise<Task | null> =>
  d
    .select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), sql`lower(${tasks.name}) = lower(${name})`))
    .then((r) => r[0] ?? null)

export const insert = (d: DB, data: NewTask): Promise<Task> =>
  d
    .insert(tasks)
    .values(data)
    .returning()
    .then((r) => r[0]!)

export const update = (
  d: DB,
  id: string,
  data: Partial<Omit<NewTask, 'id' | 'projectId' | 'createdAt'>>,
): Promise<Task | null> =>
  d
    .update(tasks)
    .set(data)
    .where(eq(tasks.id, id))
    .returning()
    .then((r) => r[0] ?? null)
