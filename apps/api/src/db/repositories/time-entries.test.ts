import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from '../schema.js'
import * as timeEntriesRepo from './time-entries.js'
import * as usersRepo from './users.js'
import * as projectsRepo from './projects.js'
import * as tasksRepo from './tasks.js'

const hasDb = !!process.env['DATABASE_URL']
const itDb = hasDb ? it : it.skip

let sql: postgres.Sql
let db: ReturnType<typeof drizzle<typeof schema>>

const MANAGER_ID = '00000000-1111-0000-0000-000000000020'
let projectId: string
let taskId: string

beforeAll(async () => {
  if (!hasDb) return
  sql = postgres(process.env['DATABASE_URL']!, { max: 1 })
  db = drizzle(sql, { schema })

  await usersRepo.insert(db, {
    id: MANAGER_ID,
    email: 'test-te-manager@example.com',
    fullName: 'TE Test Manager',
    role: 'manager',
    isActive: true,
  }).catch(() => {})

  const project = await projectsRepo.insert(db, {
    name: 'TE Test Project',
    createdBy: MANAGER_ID,
  }).catch(async () =>
    (await projectsRepo.findByNameCaseInsensitive(db, 'TE Test Project'))!,
  )
  projectId = project.id

  const task = await tasksRepo.insert(db, { projectId, name: 'TE Test Task' })
    .catch(async () =>
      (await tasksRepo.findByNameCaseInsensitive(db, projectId, 'TE Test Task'))!,
    )
  taskId = task.id
})

afterAll(async () => {
  if (!sql) return
  await db.delete(schema.timeEntries).where(eq(schema.timeEntries.userId, MANAGER_ID))
  await db.delete(schema.tasks).where(eq(schema.tasks.projectId, projectId))
  await db.delete(schema.projects).where(eq(schema.projects.id, projectId))
  await db.delete(schema.users).where(eq(schema.users.id, MANAGER_ID))
  await sql.end()
})

describe('time-entries repository', () => {
  itDb('createDraft inserts a draft entry', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const entry = await timeEntriesRepo.createDraft(db, {
      userId: MANAGER_ID,
      projectId,
      taskId,
      entryDate: today,
      hours: '1.5',
    })
    expect(entry.status).toBe('draft')
    expect(entry.hours).toBe('1.5')
  })

  itDb('findById returns null for unknown id', async () => {
    const result = await timeEntriesRepo.findById(db, '00000000-0000-0000-0000-000000000000')
    expect(result).toBeNull()
  })

  itDb('sumHoursForDate returns correct sum', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const total = await timeEntriesRepo.sumHoursForDate(db, MANAGER_ID, today)
    expect(total).toBeGreaterThan(0)
  })

  itDb('hours=0.3 is rejected by DB CHECK', async () => {
    const today = new Date().toISOString().slice(0, 10)
    await expect(
      timeEntriesRepo.createDraft(db, {
        userId: MANAGER_ID,
        projectId,
        taskId,
        entryDate: today,
        hours: '0.3',
      }),
    ).rejects.toThrow()
  })

  itDb('hours=25 is rejected by DB CHECK', async () => {
    const today = new Date().toISOString().slice(0, 10)
    await expect(
      timeEntriesRepo.createDraft(db, {
        userId: MANAGER_ID,
        projectId,
        taskId,
        entryDate: today,
        hours: '25',
      }),
    ).rejects.toThrow()
  })
})
