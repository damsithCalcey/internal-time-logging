import { db } from '@/db/client.js'
import * as usersRepo from '@/db/repositories/users.js'
import { serializeUser } from '@/db/serializers.js'
import { withTx } from '@/db/tx.js'
import * as timeEntriesService from '@/features/time-entries/service.js'
import * as timerService from '@/features/timer/service.js'
import { ConflictError, NotFoundError, ValidationError } from '@/shared/errors.js'
import { logger } from '@/shared/logger.js'
import { supabaseAdmin } from '@/shared/supabase-admin.js'
import type { CreateUserBody, UpdateUserBody } from '@repo/shared-types'

export async function listUsers() {
  const all = await usersRepo.findAll(db)
  return all.map(serializeUser)
}

export async function createUser(_callerId: string, data: CreateUserBody) {
  if (data.managerId) {
    const manager = await usersRepo.findById(db, data.managerId)
    if (!manager || manager.role !== 'manager') {
      throw new ValidationError('managerId must reference an existing manager')
    }
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    email_confirm: true,
    user_metadata: { full_name: data.fullName },
  })

  if (authError) {
    if (authError.code === 'email_exists') {
      throw new ConflictError('A user with this email already exists', 'email-conflict')
    }
    throw new Error(`Auth user creation failed: ${authError.message}`)
  }

  const authUserId = authData.user.id

  try {
    const user = await usersRepo.insert(db, {
      id: authUserId,
      email: data.email,
      fullName: data.fullName,
      role: data.role ?? 'employee',
      managerId: data.managerId ?? null,
      isActive: true,
    })
    return serializeUser(user)
  } catch (err) {
    // Compensating action: remove the auth user if the DB insert fails (D0-04)
    await supabaseAdmin.auth.admin.deleteUser(authUserId).catch((e) => {
      logger.error({ e, authUserId }, 'Failed to clean up auth user after DB insert failure')
    })
    throw err
  }
}

export async function updateUser(_callerId: string, id: string, data: UpdateUserBody) {
  const user = await usersRepo.findById(db, id)
  if (!user) throw new NotFoundError('User not found')

  // B2: block manager demotion if other users report to them
  if (data.role === 'employee' && user.role === 'manager') {
    const allUsers = await usersRepo.findAll(db)
    const hasReports = allUsers.some((u) => u.managerId === id && u.id !== id)
    if (hasReports) {
      throw new ConflictError(
        'Cannot demote manager: other users still report to them',
        'manager-has-reports',
      )
    }
  }

  // B2: validate managerId points to an actual manager
  if (data.managerId != null) {
    if (data.managerId === id) throw new ValidationError('A user cannot be their own manager')
    const manager = await usersRepo.findById(db, data.managerId)
    if (!manager || manager.role !== 'manager') {
      throw new ValidationError('managerId must reference an existing manager')
    }
  }

  const updated = await usersRepo.update(db, id, {
    ...(data.fullName !== undefined && { fullName: data.fullName }),
    ...(data.role !== undefined && { role: data.role }),
    ...(data.managerId !== undefined && { managerId: data.managerId }),
  })
  if (!updated) throw new NotFoundError('User not found')
  return serializeUser(updated)
}

export async function deactivate(userId: string) {
  const user = await usersRepo.findById(db, userId)
  if (!user) throw new NotFoundError('User not found')
  if (!user.isActive) throw new ConflictError('User is already inactive', 'already-inactive')

  const systemNote = 'Automatically rejected: user account deactivated.'
  await withTx(async (tx) => {
    await usersRepo.setActive(tx, userId, false)
    // Cross-slice calls via acyclic service graph (§1.3) — each owns its own side-effects
    await timeEntriesService.rejectAllSubmittedFor(tx, userId, systemNote)
    await timerService.discardActiveSessionFor(tx, userId)
  })

  // Outside the transaction: invalidate refresh tokens. If this fails, DB state is correct;
  // the access token expires within TTL. (D0-08, S2)
  try {
    await supabaseAdmin.auth.admin.signOut(userId)
  } catch (err) {
    logger.error({ err, userId }, 'signOut after deactivation failed')
  }
}

export async function reactivate(userId: string) {
  const user = await usersRepo.findById(db, userId)
  if (!user) throw new NotFoundError('User not found')
  if (user.isActive) throw new ConflictError('User is already active', 'already-active')
  await usersRepo.setActive(db, userId, true)
}
