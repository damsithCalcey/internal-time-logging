import { eq } from 'drizzle-orm'
import type { db } from '../client.js'
import { users, type NewUser, type User } from '../schema.js'
export type { User } from '../schema.js'
import type { Tx } from '../tx.js'

type DB = Tx | typeof db

// Published contract — services depend on this shape, not the file's named exports.
// Drift (inline Drizzle in a service) is caught by `no-drizzle-in-features` lint;
// repo signature changes that break callers are caught by the `satisfies` assertion below.
export interface UsersRepo {
  findById(d: DB, id: string): Promise<User | null>
  findByEmail(d: DB, email: string): Promise<User | null>
  findAll(d: DB): Promise<User[]>
  findAllActive(d: DB): Promise<User[]>
  insert(d: DB, data: NewUser): Promise<User>
  update(d: DB, id: string, data: Partial<Omit<NewUser, 'id' | 'createdAt'>>): Promise<User | null>
}

export const findById: UsersRepo['findById'] = (d, id) =>
  d
    .select()
    .from(users)
    .where(eq(users.id, id))
    .then((r) => r[0] ?? null)

export const findByEmail: UsersRepo['findByEmail'] = (d, email) =>
  d
    .select()
    .from(users)
    .where(eq(users.email, email))
    .then((r) => r[0] ?? null)

export const findAll: UsersRepo['findAll'] = (d) => d.select().from(users)

export const findAllActive: UsersRepo['findAllActive'] = (d) =>
  d.select().from(users).where(eq(users.isActive, true))

export const insert: UsersRepo['insert'] = (d, data) =>
  d
    .insert(users)
    .values(data)
    .returning()
    .then((r) => r[0]!)

export const update: UsersRepo['update'] = (d, id, data) =>
  d
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning()
    .then((r) => r[0] ?? null)

export const usersRepo = {
  findById,
  findByEmail,
  findAll,
  findAllActive,
  insert,
  update,
} satisfies UsersRepo
