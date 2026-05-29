import type { NewTimeEntry, TimeEntry as TimeEntryRow } from '../db/schema.js'

// Valid status transitions: 'fromStatus:toStatus' → required role
const ALLOWED: Record<string, 'any' | 'manager'> = {
  'draft:submitted': 'any',
  'submitted:draft': 'any',      // withdraw
  'submitted:approved': 'manager',
  'submitted:rejected': 'manager',
  'approved:amended': 'manager', // triggered by manager PATCH
  'rejected:draft': 'any',       // employee re-saves a rejected entry
}

type TransitionResult = { ok: true } | { ok: false; reason: string }

function canTransition(current: string, next: string, role: string): TransitionResult {
  const key = `${current}:${next}`
  const required = ALLOWED[key]
  if (required === undefined) {
    return { ok: false, reason: `Transition '${current}' → '${next}' is not permitted` }
  }
  if (required === 'manager' && role !== 'manager') {
    return { ok: false, reason: `Only managers can transition '${current}' → '${next}'` }
  }
  return { ok: true }
}

type Status = TimeEntryRow['status']

export type Actor = { id: string; role: 'manager' | 'employee' }

export type FieldPatch = {
  projectId?: string
  taskId?: string
  entryDate?: string
  hours?: string
  notes?: string | null
}

type Patch = Partial<Omit<NewTimeEntry, 'id' | 'createdAt'>>

export type Plan =
  | { ok: false; reason: string }
  | { ok: true; expectedStatus: Status; patch: Patch }

const ok = (expectedStatus: Status, patch: Patch): Plan => ({ ok: true, expectedStatus, patch })
const fail = (reason: string): Plan => ({ ok: false, reason })

export class TimeEntry {
  private constructor(private readonly row: TimeEntryRow) {}

  static from(row: TimeEntryRow): TimeEntry {
    return new TimeEntry(row)
  }

  get id(): string {
    return this.row.id
  }

  get userId(): string {
    return this.row.userId
  }

  get status(): Status {
    return this.row.status
  }

  get raw(): TimeEntryRow {
    return this.row
  }

  // draft → submitted
  submit(): Plan {
    const sm = canTransition(this.row.status, 'submitted', 'employee')
    if (!sm.ok) return fail(sm.reason)
    return ok(this.row.status, { status: 'submitted' })
  }

  // submitted → draft
  withdraw(): Plan {
    const sm = canTransition(this.row.status, 'draft', 'employee')
    if (!sm.ok) return fail(sm.reason)
    return ok(this.row.status, { status: 'draft' })
  }

  // submitted → approved (manager only)
  approve(actor: Actor): Plan {
    const sm = canTransition(this.row.status, 'approved', actor.role)
    if (!sm.ok) return fail(sm.reason)
    return ok(this.row.status, { status: 'approved' })
  }

  // submitted → rejected (manager only); note is required
  reject(actor: Actor, note: string): Plan {
    const sm = canTransition(this.row.status, 'rejected', actor.role)
    if (!sm.ok) return fail(sm.reason)
    const trimmed = note.trim()
    if (!trimmed) return fail('Rejection note is required')
    return ok(this.row.status, { status: 'rejected', managerNote: trimmed })
  }

  // Employee field edit: allowed in draft and rejected; rejected flips to draft.
  // Authorization (entry.userId === caller) is enforced by the service.
  editAsEmployee(patch: FieldPatch): Plan {
    if (this.row.status !== 'draft' && this.row.status !== 'rejected') {
      return fail(`Cannot edit an entry with status '${this.row.status}'`)
    }
    const fields = stripUndefined(patch)
    const statusPatch: Patch = this.row.status === 'rejected' ? { status: 'draft' } : {}
    return ok(this.row.status, { ...fields, ...statusPatch })
  }

  // Manager field edit: D5-03.
  //   approved   → amended:  set amendedAt/amendedBy; populate originalHours (once).
  //   amended    → amended:  refresh amendedAt/amendedBy; preserve originalHours.
  //   draft / submitted / rejected → plain field update, status preserved.
  editAsManager(actor: Actor, patch: FieldPatch): Plan {
    if (actor.role !== 'manager') return fail('Only managers can edit on behalf of others')
    const fields = stripUndefined(patch)

    if (this.row.status === 'approved') {
      const sm = canTransition('approved', 'amended', 'manager')
      if (!sm.ok) return fail(sm.reason)
      return ok('approved', {
        ...fields,
        status: 'amended',
        amendedAt: new Date(),
        amendedBy: actor.id,
        // Populate once: keep the first captured originalHours, otherwise snapshot current.
        originalHours: this.row.originalHours ?? this.row.hours,
      })
    }

    if (this.row.status === 'amended') {
      // No status transition; refresh amendment metadata, preserve originalHours.
      return ok('amended', {
        ...fields,
        amendedAt: new Date(),
        amendedBy: actor.id,
      })
    }

    // draft / submitted / rejected — guarded field update, no status change.
    return ok(this.row.status, fields)
  }
}

function stripUndefined(patch: FieldPatch): Patch {
  const out: Patch = {}
  if (patch.projectId !== undefined) out.projectId = patch.projectId
  if (patch.taskId !== undefined) out.taskId = patch.taskId
  if (patch.entryDate !== undefined) out.entryDate = patch.entryDate
  if (patch.hours !== undefined) out.hours = patch.hours
  if (patch.notes !== undefined) out.notes = patch.notes
  return out
}
