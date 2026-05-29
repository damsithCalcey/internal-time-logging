import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as schema from '../schema.js'
import * as usersRepo from './users.js'

// Integration tests require a live DATABASE_URL — skip in CI without one
const hasDb = !!process.env['DATABASE_URL']
const itDb = hasDb ? it : it.skip

let sql: postgres.Sql
let db: ReturnType<typeof drizzle<typeof schema>>

const TEST_USER_ID = '00000000-1111-0000-0000-000000000001'
const TEST_USER: schema.NewUser = {
  id: TEST_USER_ID,
  email: 'test-user-repo@example.com',
  fullName: 'Test User',
  role: 'employee',
  isActive: true,
}

beforeAll(async () => {
  if (!hasDb) return
  sql = postgres(process.env['DATABASE_URL']!, { max: 1 })
  db = drizzle(sql, { schema })
  // Clean up from any previous test run
  await db.delete(schema.users).where(eq(schema.users.id, TEST_USER_ID))
})

afterAll(async () => {
  if (!sql) return
  await db.delete(schema.users).where(eq(schema.users.id, TEST_USER_ID))
  await sql.end()
})

describe('users repository', () => {
  itDb('findById returns null for unknown id', async () => {
    const result = await usersRepo.findById(db, '00000000-0000-0000-0000-000000000000')
    expect(result).toBeNull()
  })

  itDb('insert creates a user row', async () => {
    const user = await usersRepo.insert(db, TEST_USER)
    expect(user.id).toBe(TEST_USER_ID)
    expect(user.email).toBe(TEST_USER.email)
    expect(user.role).toBe('employee')
    expect(user.isActive).toBe(true)
  })

  itDb('findById returns the inserted user', async () => {
    const user = await usersRepo.findById(db, TEST_USER_ID)
    expect(user).not.toBeNull()
    expect(user!.fullName).toBe('Test User')
  })

  itDb('findByEmail returns the inserted user', async () => {
    const user = await usersRepo.findByEmail(db, TEST_USER.email)
    expect(user).not.toBeNull()
    expect(user!.id).toBe(TEST_USER_ID)
  })

  itDb('update flips isActive', async () => {
    const updated = await usersRepo.update(db, TEST_USER_ID, { isActive: false })
    expect(updated?.isActive).toBe(false)
    const updated2 = await usersRepo.update(db, TEST_USER_ID, { isActive: true })
    expect(updated2?.isActive).toBe(true)
  })

  itDb('findAllActive excludes inactive users', async () => {
    await usersRepo.update(db, TEST_USER_ID, { isActive: false })
    const active = await usersRepo.findAllActive(db)
    expect(active.find((u) => u.id === TEST_USER_ID)).toBeUndefined()
    await usersRepo.update(db, TEST_USER_ID, { isActive: true })
  })
})
