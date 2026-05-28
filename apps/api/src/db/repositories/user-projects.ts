import { and, countDistinct, eq } from 'drizzle-orm'
import type { db } from '../client.js'
import { userProjects, users, type NewUserProject, type UserProject } from '../schema.js'
import type { Tx } from '../tx.js'

type DB = Tx | typeof db

export const findByUser = (d: DB, userId: string): Promise<UserProject[]> =>
  d.select().from(userProjects).where(eq(userProjects.userId, userId))

export const findByProject = (d: DB, projectId: string): Promise<UserProject[]> =>
  d.select().from(userProjects).where(eq(userProjects.projectId, projectId))

export const findOne = (d: DB, userId: string, projectId: string): Promise<UserProject | null> =>
  d
    .select()
    .from(userProjects)
    .where(and(eq(userProjects.userId, userId), eq(userProjects.projectId, projectId)))
    .then((r) => r[0] ?? null)

export const insert = (d: DB, data: NewUserProject): Promise<UserProject> =>
  d
    .insert(userProjects)
    .values(data)
    .returning()
    .then((r) => r[0]!)

export const remove = (d: DB, userId: string, projectId: string): Promise<void> =>
  d
    .delete(userProjects)
    .where(and(eq(userProjects.userId, userId), eq(userProjects.projectId, projectId)))
    .then(() => undefined)

export const findByProjectWithUsers = (d: DB, projectId: string) =>
  d
    .select({
      userId: userProjects.userId,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
      assignedAt: userProjects.assignedAt,
    })
    .from(userProjects)
    .innerJoin(users, eq(users.id, userProjects.userId))
    .where(eq(userProjects.projectId, projectId))
    .orderBy(users.fullName)

export const countDistinctUsers = (d: DB): Promise<number> =>
  d
    .select({ count: countDistinct(userProjects.userId) })
    .from(userProjects)
    .then((r) => Number(r[0]?.count ?? 0))
