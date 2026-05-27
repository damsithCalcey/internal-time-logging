/**
 * Seed script — creates dev/test data in the Supabase project.
 *
 * Accounts use plus-addressing per dev plan Stage 1:
 *   damsith+manager@calcey.com  (role: manager)
 *   damsith+emp1@calcey.com     (role: employee, reports to manager)
 *   damsith+emp2@calcey.com     (role: employee, reports to manager)
 *
 * One project ("Calcey Hours"), two tasks, emp1 assigned to the project.
 *
 * Run: pnpm --filter api db:seed
 * Requires: DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import postgres from 'postgres'
import * as schema from '../src/db/schema.js'

const SEED_PASSWORD = 'Calcey123!'

const SEED_USERS = [
  {
    email: 'damsith+manager@calcey.com',
    fullName: 'Damsith Manager',
    role: 'manager' as const,
  },
  {
    email: 'damsith+emp1@calcey.com',
    fullName: 'Employee One',
    role: 'employee' as const,
    managerEmail: 'damsith+manager@calcey.com',
  },
  {
    email: 'damsith+emp2@calcey.com',
    fullName: 'Employee Two',
    role: 'employee' as const,
    managerEmail: 'damsith+manager@calcey.com',
  },
]

async function main() {
  const supabaseUrl = process.env['SUPABASE_URL']
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']
  const databaseUrl = process.env['DATABASE_URL']

  if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
    console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const pgClient = postgres(databaseUrl, { max: 1 })
  const db = drizzle(pgClient, { schema })

  console.log('Creating auth users...')
  const authUserIds: Record<string, string> = {}

  for (const user of SEED_USERS) {
    // Check if auth user already exists
    const { data: existing } = await supabase.auth.admin.listUsers()
    const existingUser = existing?.users.find((u) => u.email === user.email)

    if (existingUser) {
      console.log(`  ✓ ${user.email} already exists (${existingUser.id})`)
      authUserIds[user.email] = existingUser.id
      continue
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: SEED_PASSWORD,
      email_confirm: true,
    })

    if (error || !data.user) {
      console.error(`  ✗ Failed to create ${user.email}:`, error?.message)
      process.exit(1)
    }

    console.log(`  ✓ Created ${user.email} (${data.user.id})`)
    authUserIds[user.email] = data.user.id
  }

  console.log('\nCreating public.users rows...')
  const managerId = authUserIds['damsith+manager@calcey.com']!

  for (const user of SEED_USERS) {
    const id = authUserIds[user.email]!
    const managerIdValue =
      user.managerEmail ? authUserIds[user.managerEmail] : undefined

    await db
      .insert(schema.users)
      .values({
        id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        managerId: managerIdValue ?? null,
        isActive: true,
      })
      .onConflictDoNothing()

    console.log(`  ✓ ${user.email} (${user.role})`)
  }

  console.log('\nCreating project and tasks...')
  const [project] = await db
    .insert(schema.projects)
    .values({
      name: 'Calcey Hours',
      description: 'Internal time logging application',
      createdBy: managerId,
    })
    .onConflictDoNothing()
    .returning()

  if (!project) {
    // Already exists; look it up
    const [existing] = await db
      .select()
      .from(schema.projects)
      .where(sql`lower(${schema.projects.name}) = 'calcey hours'`)
    if (!existing) {
      console.error('Failed to create or find the seed project')
      process.exit(1)
    }
    console.log(`  ✓ Project "Calcey Hours" already exists (${existing.id})`)

    console.log('\nDone — seed data already present.')
    await pgClient.end()
    return
  }

  console.log(`  ✓ Project "Calcey Hours" (${project.id})`)

  const taskNames = ['Development', 'Code Review']
  for (const name of taskNames) {
    const [task] = await db
      .insert(schema.tasks)
      .values({ projectId: project.id, name })
      .onConflictDoNothing()
      .returning()
    console.log(`  ✓ Task "${name}" (${task?.id ?? 'already exists'})`)
  }

  console.log('\nAssigning emp1 to the project...')
  const emp1Id = authUserIds['damsith+emp1@calcey.com']!
  await db
    .insert(schema.userProjects)
    .values({ userId: emp1Id, projectId: project.id, assignedBy: managerId })
    .onConflictDoNothing()
  console.log(`  ✓ emp1 assigned to "Calcey Hours"`)

  console.log('\nSeed complete.')
  console.log('\nCredentials:')
  for (const user of SEED_USERS) {
    console.log(`  ${user.email}  /  ${SEED_PASSWORD}  (${user.role})`)
  }

  await pgClient.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
