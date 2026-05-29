import { db } from '@/db/client.js'
import { usersRepo } from '@/db/repositories/index.js'
import { withTx } from '@/db/tx.js'
import { User } from '@/domain/user.js'
import { ConflictError, NotFoundError, ValidationError } from '@/shared/errors.js'
import { logger } from '@/shared/logger.js'
import { supabaseAdmin } from '@/db/supabase-admin.js'
import * as timeEntriesCommands from '@/useCases/time-entries/commands.js'
import * as timerCommands from '@/useCases/timer/commands.js'
import type { CreateUserBody, UpdateUserBody } from '@repo/shared-types'

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
    return await usersRepo.insert(db, {
      id: authUserId,
      email: data.email,
      fullName: data.fullName,
      role: data.role ?? 'employee',
      managerId: data.managerId ?? null,
      isActive: true,
    })
  } catch (err) {
    // Compensating action: remove the auth user if the DB insert fails (D0-04)
    await supabaseAdmin.auth.admin.deleteUser(authUserId).catch((e) => {
      logger.error({ e, authUserId }, 'Failed to clean up auth user after DB insert failure')
    })
    throw err
  }
}

export async function updateUser(_callerId: string, id: string, data: UpdateUserBody) {
  const row = await usersRepo.findById(db, id)
  if (!row) throw new NotFoundError('User not found')
  const user = User.from(row)

  const plan = user.updateProfile(data)
  if (!plan.ok) throw new ValidationError(plan.reason)

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

  if (data.managerId != null) {
    const manager = await usersRepo.findById(db, data.managerId)
    if (!manager || manager.role !== 'manager') {
      throw new ValidationError('managerId must reference an existing manager')
    }
  }

  const updated = await usersRepo.update(db, id, plan.patch)
  if (!updated) throw new NotFoundError('User not found')
  return updated
}

export async function deactivate(userId: string) {
  const row = await usersRepo.findById(db, userId)
  if (!row) throw new NotFoundError('User not found')
  const user = User.from(row)

  const plan = user.deactivate()
  if (!plan.ok) throw new ConflictError(plan.reason, 'already-inactive')

  const systemNote = 'Automatically rejected: user account deactivated.'
  await withTx(async (tx) => {
    await usersRepo.update(tx, userId, plan.patch)
    await timeEntriesCommands.rejectAllSubmittedFor(tx, userId, systemNote)
    await timerCommands.discardActiveSessionFor(tx, userId)
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
  const row = await usersRepo.findById(db, userId)
  if (!row) throw new NotFoundError('User not found')
  const user = User.from(row)

  const plan = user.reactivate()
  if (!plan.ok) throw new ConflictError(plan.reason, 'already-active')

  await usersRepo.update(db, userId, plan.patch)
}
