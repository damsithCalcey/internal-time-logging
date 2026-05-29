import { describe, expect, it } from 'vitest'
import type { User as UserRow } from '../db/schema.js'
import { User } from './user.js'

function rowOf(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 'user-1',
    email: 'user-1@calcey.com',
    fullName: 'User One',
    role: 'employee',
    managerId: null,
    isActive: true,
    createdAt: new Date('2026-05-29T10:00:00Z'),
    updatedAt: new Date('2026-05-29T10:00:00Z'),
    ...overrides,
  }
}

describe('User entity', () => {
  describe('deactivate()', () => {
    it('active → inactive', () => {
      const plan = User.from(rowOf({ isActive: true })).deactivate()
      expect(plan).toEqual({ ok: true, patch: { isActive: false } })
    })
    it('rejects when already inactive', () => {
      const plan = User.from(rowOf({ isActive: false })).deactivate()
      expect(plan.ok).toBe(false)
      if (!plan.ok) expect(plan.reason).toMatch(/already inactive/)
    })
  })

  describe('reactivate()', () => {
    it('inactive → active', () => {
      const plan = User.from(rowOf({ isActive: false })).reactivate()
      expect(plan).toEqual({ ok: true, patch: { isActive: true } })
    })
    it('rejects when already active', () => {
      const plan = User.from(rowOf({ isActive: true })).reactivate()
      expect(plan.ok).toBe(false)
      if (!plan.ok) expect(plan.reason).toMatch(/already active/)
    })
  })

  describe('updateProfile()', () => {
    it('projects only the fields that were provided', () => {
      const plan = User.from(rowOf()).updateProfile({ fullName: 'New Name' })
      expect(plan).toEqual({ ok: true, patch: { fullName: 'New Name' } })
    })

    it('accepts a role change', () => {
      const plan = User.from(rowOf({ role: 'employee' })).updateProfile({ role: 'manager' })
      expect(plan).toEqual({ ok: true, patch: { role: 'manager' } })
    })

    it('accepts clearing managerId via null', () => {
      const plan = User.from(rowOf({ managerId: 'mgr-1' })).updateProfile({ managerId: null })
      expect(plan).toEqual({ ok: true, patch: { managerId: null } })
    })

    it('rejects self-as-manager', () => {
      const plan = User.from(rowOf({ id: 'user-1' })).updateProfile({ managerId: 'user-1' })
      expect(plan.ok).toBe(false)
      if (!plan.ok) expect(plan.reason).toMatch(/own manager/)
    })

    it('produces a single-field patch when only one field is supplied', () => {
      const plan = User.from(rowOf()).updateProfile({ fullName: 'Keep Me' })
      expect(plan).toEqual({ ok: true, patch: { fullName: 'Keep Me' } })
    })

    it('produces an empty patch when nothing changes', () => {
      const plan = User.from(rowOf()).updateProfile({})
      expect(plan).toEqual({ ok: true, patch: {} })
    })
  })
})
