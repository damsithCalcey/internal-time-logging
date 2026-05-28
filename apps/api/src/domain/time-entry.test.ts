import { describe, expect, it } from 'vitest'
import type { TimeEntry as TimeEntryRow } from '../db/schema.js'
import { TimeEntry, type Actor } from './time-entry.js'

const employee: Actor = { id: 'emp-1', role: 'employee' }
const manager: Actor = { id: 'mgr-1', role: 'manager' }

function rowOf(overrides: Partial<TimeEntryRow> = {}): TimeEntryRow {
  return {
    id: 'te-1',
    userId: 'emp-1',
    projectId: 'proj-1',
    taskId: 'task-1',
    entryDate: '2026-05-29',
    hours: '4.0',
    notes: null,
    status: 'draft',
    managerNote: null,
    amendedAt: null,
    amendedBy: null,
    originalHours: null,
    createdAt: new Date('2026-05-29T10:00:00Z'),
    updatedAt: new Date('2026-05-29T10:00:00Z'),
    ...overrides,
  }
}

describe('TimeEntry entity', () => {
  describe('submit()', () => {
    it('draft → submitted', () => {
      const plan = TimeEntry.from(rowOf({ status: 'draft' })).submit()
      expect(plan).toEqual({
        ok: true,
        expectedStatus: 'draft',
        patch: { status: 'submitted' },
      })
    })
    it('rejects if not in draft', () => {
      const plan = TimeEntry.from(rowOf({ status: 'submitted' })).submit()
      expect(plan.ok).toBe(false)
    })
  })

  describe('withdraw()', () => {
    it('submitted → draft', () => {
      const plan = TimeEntry.from(rowOf({ status: 'submitted' })).withdraw()
      expect(plan).toEqual({
        ok: true,
        expectedStatus: 'submitted',
        patch: { status: 'draft' },
      })
    })
    it('rejects when not submitted', () => {
      const plan = TimeEntry.from(rowOf({ status: 'approved' })).withdraw()
      expect(plan.ok).toBe(false)
    })
  })

  describe('approve()', () => {
    it('manager approves a submitted entry', () => {
      const plan = TimeEntry.from(rowOf({ status: 'submitted' })).approve(manager)
      expect(plan).toEqual({
        ok: true,
        expectedStatus: 'submitted',
        patch: { status: 'approved' },
      })
    })
    it('employee cannot approve', () => {
      const plan = TimeEntry.from(rowOf({ status: 'submitted' })).approve(employee)
      expect(plan.ok).toBe(false)
    })
    it('cannot approve a non-submitted entry', () => {
      const plan = TimeEntry.from(rowOf({ status: 'draft' })).approve(manager)
      expect(plan.ok).toBe(false)
    })
  })

  describe('reject()', () => {
    it('manager rejects with trimmed note', () => {
      const plan = TimeEntry.from(rowOf({ status: 'submitted' })).reject(manager, '  needs detail  ')
      expect(plan).toEqual({
        ok: true,
        expectedStatus: 'submitted',
        patch: { status: 'rejected', managerNote: 'needs detail' },
      })
    })
    it('empty note rejected', () => {
      const plan = TimeEntry.from(rowOf({ status: 'submitted' })).reject(manager, '   ')
      expect(plan.ok).toBe(false)
      if (!plan.ok) expect(plan.reason).toMatch(/note is required/)
    })
    it('employee cannot reject', () => {
      const plan = TimeEntry.from(rowOf({ status: 'submitted' })).reject(employee, 'no')
      expect(plan.ok).toBe(false)
    })
  })

  describe('editAsEmployee()', () => {
    it('edits a draft entry without changing status', () => {
      const plan = TimeEntry.from(rowOf({ status: 'draft' })).editAsEmployee({ hours: '5.5' })
      expect(plan).toEqual({
        ok: true,
        expectedStatus: 'draft',
        patch: { hours: '5.5' },
      })
    })
    it('flips rejected → draft on edit', () => {
      const plan = TimeEntry.from(rowOf({ status: 'rejected' })).editAsEmployee({ hours: '2.0' })
      expect(plan).toEqual({
        ok: true,
        expectedStatus: 'rejected',
        patch: { hours: '2.0', status: 'draft' },
      })
    })
    it('blocks edits on submitted', () => {
      const plan = TimeEntry.from(rowOf({ status: 'submitted' })).editAsEmployee({ hours: '1.0' })
      expect(plan.ok).toBe(false)
    })
    it('blocks edits on approved', () => {
      const plan = TimeEntry.from(rowOf({ status: 'approved' })).editAsEmployee({ hours: '1.0' })
      expect(plan.ok).toBe(false)
    })
    it('blocks edits on amended', () => {
      const plan = TimeEntry.from(rowOf({ status: 'amended' })).editAsEmployee({ hours: '1.0' })
      expect(plan.ok).toBe(false)
    })
  })

  describe('editAsManager()', () => {
    it('approved → amended: populates originalHours and amendment metadata', () => {
      const plan = TimeEntry.from(
        rowOf({ status: 'approved', hours: '6.0', originalHours: null }),
      ).editAsManager(manager, { hours: '7.0' })
      expect(plan.ok).toBe(true)
      if (!plan.ok) return
      expect(plan.expectedStatus).toBe('approved')
      expect(plan.patch.status).toBe('amended')
      expect(plan.patch.hours).toBe('7.0')
      expect(plan.patch.amendedBy).toBe('mgr-1')
      expect(plan.patch.amendedAt).toBeInstanceOf(Date)
      expect(plan.patch.originalHours).toBe('6.0')
    })

    it('amended → amended re-edit: refreshes metadata, does NOT touch originalHours', () => {
      const plan = TimeEntry.from(
        rowOf({ status: 'amended', hours: '7.0', originalHours: '6.0', amendedBy: 'mgr-1' }),
      ).editAsManager(manager, { hours: '7.5' })
      expect(plan.ok).toBe(true)
      if (!plan.ok) return
      expect(plan.expectedStatus).toBe('amended')
      expect(plan.patch.status).toBeUndefined() // status stays amended via the expectedStatus guard
      expect(plan.patch.hours).toBe('7.5')
      expect(plan.patch.amendedAt).toBeInstanceOf(Date)
      expect(plan.patch.amendedBy).toBe('mgr-1')
      // populate-once: originalHours must not be re-set, the row's '6.0' is preserved
      expect(plan.patch.originalHours).toBeUndefined()
    })

    it('approved → amended preserves a pre-existing originalHours (idempotent populate-once)', () => {
      const plan = TimeEntry.from(
        rowOf({ status: 'approved', hours: '7.0', originalHours: '6.0' }),
      ).editAsManager(manager, { hours: '8.0' })
      expect(plan.ok).toBe(true)
      if (!plan.ok) return
      // Even though the transition runs, originalHours sticks to the already-captured 6.0
      expect(plan.patch.originalHours).toBe('6.0')
    })

    it('plain field update on draft (no status change, no amendment metadata)', () => {
      const plan = TimeEntry.from(rowOf({ status: 'draft' })).editAsManager(manager, {
        notes: 'manager-note',
      })
      expect(plan).toEqual({
        ok: true,
        expectedStatus: 'draft',
        patch: { notes: 'manager-note' },
      })
    })

    it('plain field update on submitted preserves status', () => {
      const plan = TimeEntry.from(rowOf({ status: 'submitted' })).editAsManager(manager, {
        hours: '3.0',
      })
      expect(plan).toEqual({
        ok: true,
        expectedStatus: 'submitted',
        patch: { hours: '3.0' },
      })
    })

    it('rejects an employee actor', () => {
      const plan = TimeEntry.from(rowOf({ status: 'approved' })).editAsManager(employee, {
        hours: '5.0',
      })
      expect(plan.ok).toBe(false)
    })
  })
})
