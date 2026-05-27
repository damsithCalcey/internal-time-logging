import { eq } from 'drizzle-orm'
import { db } from '../client.js'
import { users, type NewUser, type User } from '../schema.js'
import type { Tx } from '../tx.js'

type DB = Tx | typeof db

export const findById = (d: DB, id: string): Promise<User | null> =>
  d
    .select()
    .from(users)
    .where(eq(users.id, id))
    .then((r) => r[0] ?? null)

export const findByEmail = (d: DB, email: string): Promise<User | null> =>
  d
    .select()
    .from(users)
    .where(eq(users.email, email))
    .then((r) => r[0] ?? null)

export const findAll = (d: DB): Promise<User[]> => d.select().from(users)

export const findAllActive = (d: DB): Promise<User[]> =>
  d.select().from(users).where(eq(users.isActive, true))

export const insert = (d: DB, data: NewUser): Promise<User> =>
  d
    .insert(users)
    .values(data)
    .returning()
    .then((r) => r[0]!)

export const update = (
  d: DB,
  id: string,
  data: Partial<Omit<NewUser, 'id' | 'createdAt'>>,
): Promise<User | null> =>
  d
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning()
    .then((r) => r[0] ?? null)

export const setActive = (d: DB, id: string, isActive: boolean): Promise<User | null> =>
  d
    .update(users)
    .set({ isActive })
    .where(eq(users.id, id))
    .returning()
    .then((r) => r[0] ?? null)
