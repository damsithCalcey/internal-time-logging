import { describe, expect, it } from 'vitest'
import { canTransition } from './state-machine.js'

describe('canTransition', () => {
  describe('valid employee transitions', () => {
    it('draft → submitted', () => {
      expect(canTransition('draft', 'submitted', 'employee')).toEqual({ ok: true })
    })
    it('submitted → draft (withdraw)', () => {
      expect(canTransition('submitted', 'draft', 'employee')).toEqual({ ok: true })
    })
    it('rejected → draft (re-save)', () => {
      expect(canTransition('rejected', 'draft', 'employee')).toEqual({ ok: true })
    })
  })

  describe('valid manager transitions', () => {
    it('draft → submitted', () => {
      expect(canTransition('draft', 'submitted', 'manager')).toEqual({ ok: true })
    })
    it('submitted → draft (withdraw)', () => {
      expect(canTransition('submitted', 'draft', 'manager')).toEqual({ ok: true })
    })
    it('submitted → approved', () => {
      expect(canTransition('submitted', 'approved', 'manager')).toEqual({ ok: true })
    })
    it('submitted → rejected', () => {
      expect(canTransition('submitted', 'rejected', 'manager')).toEqual({ ok: true })
    })
    it('approved → amended', () => {
      expect(canTransition('approved', 'amended', 'manager')).toEqual({ ok: true })
    })
    it('rejected → draft', () => {
      expect(canTransition('rejected', 'draft', 'manager')).toEqual({ ok: true })
    })
  })

  describe('employee cannot perform manager-only transitions', () => {
    it('submitted → approved blocked for employee', () => {
      expect(canTransition('submitted', 'approved', 'employee').ok).toBe(false)
    })
    it('submitted → rejected blocked for employee', () => {
      expect(canTransition('submitted', 'rejected', 'employee').ok).toBe(false)
    })
    it('approved → amended blocked for employee', () => {
      expect(canTransition('approved', 'amended', 'employee').ok).toBe(false)
    })
  })

  describe('invalid transitions (full negative matrix)', () => {
    it('approved → submitted', () => {
      expect(canTransition('approved', 'submitted', 'manager').ok).toBe(false)
    })
    it('approved → draft', () => {
      expect(canTransition('approved', 'draft', 'manager').ok).toBe(false)
    })
    it('approved → rejected', () => {
      expect(canTransition('approved', 'rejected', 'manager').ok).toBe(false)
    })
    it('rejected → approved', () => {
      expect(canTransition('rejected', 'approved', 'manager').ok).toBe(false)
    })
    it('rejected → submitted', () => {
      expect(canTransition('rejected', 'submitted', 'manager').ok).toBe(false)
    })
    it('draft → approved', () => {
      expect(canTransition('draft', 'approved', 'manager').ok).toBe(false)
    })
    it('draft → rejected', () => {
      expect(canTransition('draft', 'rejected', 'manager').ok).toBe(false)
    })
    it('draft → amended', () => {
      expect(canTransition('draft', 'amended', 'manager').ok).toBe(false)
    })
    // amended is a terminal state — no outgoing transitions
    it('amended → draft (terminal)', () => {
      expect(canTransition('amended', 'draft', 'manager').ok).toBe(false)
    })
    it('amended → submitted (terminal)', () => {
      expect(canTransition('amended', 'submitted', 'manager').ok).toBe(false)
    })
    it('amended → approved (terminal)', () => {
      expect(canTransition('amended', 'approved', 'manager').ok).toBe(false)
    })
    it('amended → rejected (terminal)', () => {
      expect(canTransition('amended', 'rejected', 'manager').ok).toBe(false)
    })
  })
})
