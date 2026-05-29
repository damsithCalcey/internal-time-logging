// Domain entity wrapping a User row with the within-row operations that
// mutate it. Pure: no I/O, no DB. The service composes the returned `Plan`
// with `usersRepo.update` for persistence and is responsible for cross-row
// invariants (e.g. "managerId points to an actual manager",
// "no other users still report to this manager during demotion").
//
// Why an entity instead of free functions in the service:
//   - The active/inactive guards ("already active" / "already inactive") and
//     the self-as-manager invariant live in one place instead of being
//     scattered across `deactivate`/`reactivate`/`updateUser`.
//   - Field-edit and lifecycle (de/reactivate) calls return the same uniform
//     `Plan` shape, so the service has a single persistence path.
//
// See also: domain/time-entry.ts (sibling entity following the same pattern).

import type { NewUser, User as UserRow } from '../db/schema.js'

type Role = UserRow['role']

export type FieldPatch = {
  fullName?: string
  role?: Role
  managerId?: string | null
}

type Patch = Partial<Omit<NewUser, 'id' | 'createdAt'>>

export type Plan =
  | { ok: false; reason: string }
  | { ok: true; patch: Patch }

const ok = (patch: Patch): Plan => ({ ok: true, patch })
const fail = (reason: string): Plan => ({ ok: false, reason })

export class User {
  private constructor(private readonly row: UserRow) {}

  static from(row: UserRow): User {
    return new User(row)
  }

  get id(): string {
    return this.row.id
  }

  get role(): Role {
    return this.row.role
  }

  get isActive(): boolean {
    return this.row.isActive
  }

  get raw(): UserRow {
    return this.row
  }

  // active → inactive
  deactivate(): Plan {
    if (!this.row.isActive) return fail('User is already inactive')
    return ok({ isActive: false })
  }

  // inactive → active
  reactivate(): Plan {
    if (this.row.isActive) return fail('User is already active')
    return ok({ isActive: true })
  }

  // Field edit. Cross-row checks (managerId references an existing manager,
  // demoting a manager that still has reports) belong on the service — the
  // entity only enforces invariants computable from its own row.
  updateProfile(patch: FieldPatch): Plan {
    if (patch.managerId !== undefined && patch.managerId === this.row.id) {
      return fail('A user cannot be their own manager')
    }
    return ok(stripUndefined(patch))
  }
}

function stripUndefined(patch: FieldPatch): Patch {
  const out: Patch = {}
  if (patch.fullName !== undefined) out.fullName = patch.fullName
  if (patch.role !== undefined) out.role = patch.role
  if (patch.managerId !== undefined) out.managerId = patch.managerId
  return out
}
