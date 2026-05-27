import { eq, sql } from 'drizzle-orm'
import { db } from '../client.js'
import { projects, type NewProject, type Project } from '../schema.js'
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
