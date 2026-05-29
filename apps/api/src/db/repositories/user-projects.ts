import { and, countDistinct, eq } from 'drizzle-orm'
import type { db } from '../client.js'
import {
  userProjects,
  users,
  type NewUserProject,
  type User,
  type UserProject,
} from '../schema.js'
export type { UserProject } from '../schema.js'
import type { Tx } from '../tx.js'

type DB = Tx | typeof db

export type ProjectMemberRow = {
  userId: string
  fullName: string
  email: string
  role: User['role']
  assignedAt: Date
}

export interface UserProjectsRepo {
  findByUser(d: DB, userId: string): Promise<UserProject[]>
  findByProject(d: DB, projectId: string): Promise<UserProject[]>
  findOne(d: DB, userId: string, projectId: string): Promise<UserProject | null>
  insert(d: DB, data: NewUserProject): Promise<UserProject>
  remove(d: DB, userId: string, projectId: string): Promise<void>
  findByProjectWithUsers(d: DB, projectId: string): Promise<ProjectMemberRow[]>
  countDistinctUsers(d: DB): Promise<number>
}

export const findByUser: UserProjectsRepo['findByUser'] = (d, userId) =>
  d.select().from(userProjects).where(eq(userProjects.userId, userId))

export const findByProject: UserProjectsRepo['findByProject'] = (d, projectId) =>
  d.select().from(userProjects).where(eq(userProjects.projectId, projectId))

export const findOne: UserProjectsRepo['findOne'] = (d, userId, projectId) =>
  d
    .select()
    .from(userProjects)
    .where(and(eq(userProjects.userId, userId), eq(userProjects.projectId, projectId)))
    .then((r) => r[0] ?? null)

export const insert: UserProjectsRepo['insert'] = (d, data) =>
  d
    .insert(userProjects)
    .values(data)
    .returning()
    .then((r) => r[0]!)

export const remove: UserProjectsRepo['remove'] = (d, userId, projectId) =>
  d
    .delete(userProjects)
    .where(and(eq(userProjects.userId, userId), eq(userProjects.projectId, projectId)))
    .then(() => undefined)

export const findByProjectWithUsers: UserProjectsRepo['findByProjectWithUsers'] = (d, projectId) =>
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

export const countDistinctUsers: UserProjectsRepo['countDistinctUsers'] = (d) =>
  d
    .select({ count: countDistinct(userProjects.userId) })
    .from(userProjects)
    .then((r) => Number(r[0]?.count ?? 0))

export const userProjectsRepo = {
  findByUser,
  findByProject,
  findOne,
  insert,
  remove,
  findByProjectWithUsers,
  countDistinctUsers,
} satisfies UserProjectsRepo
