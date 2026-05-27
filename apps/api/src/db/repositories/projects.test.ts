import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from '../schema.js'
import * as projectsRepo from './projects.js'
import * as usersRepo from './users.js'

const hasDb = !!process.env['DATABASE_URL']
const itDb = hasDb ? it : it.skip

let sql: postgres.Sql
let db: ReturnType<typeof drizzle<typeof schema>>

const MANAGER_ID = '00000000-1111-0000-0000-000000000010'

beforeAll(async () => {
  if (!hasDb) return
  sql = postgres(process.env['DATABASE_URL']!, { max: 1 })
  db = drizzle(sql, { schema })
  // Seed manager user
  await usersRepo.insert(db, {
    id: MANAGER_ID,
    email: 'test-project-manager@example.com',
    fullName: 'Project Test Manager',
    role: 'manager',
    isActive: true,
  }).catch(() => {})
})

afterAll(async () => {
  if (!sql) return
  await db.delete(schema.projects).where(eq(schema.projects.createdBy, MANAGER_ID))
  await db.delete(schema.users).where(eq(schema.users.id, MANAGER_ID))
  await sql.end()
})

describe('projects repository', () => {
  itDb('findById returns null for unknown id', async () => {
    const result = await projectsRepo.findById(db, '00000000-0000-0000-0000-000000000000')
    expect(result).toBeNull()
  })

  itDb('insert creates a project row', async () => {
    const project = await projectsRepo.insert(db, {
      name: 'Test Project Alpha',
      createdBy: MANAGER_ID,
    })
    expect(project.id).toBeTruthy()
    expect(project.name).toBe('Test Project Alpha')
  })

  itDb('findByNameCaseInsensitive matches regardless of case', async () => {
    const project = await projectsRepo.findByNameCaseInsensitive(db, 'test project alpha')
    expect(project).not.toBeNull()
    const project2 = await projectsRepo.findByNameCaseInsensitive(db, 'TEST PROJECT ALPHA')
    expect(project2?.id).toBe(project?.id)
  })

  itDb('duplicate lower-case project name is rejected by DB', async () => {
    await expect(
      projectsRepo.insert(db, { name: 'TEST PROJECT ALPHA', createdBy: MANAGER_ID }),
    ).rejects.toThrow()
  })
})
