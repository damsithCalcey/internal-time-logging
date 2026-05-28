export type TransitionResult = { ok: true } | { ok: false; reason: string }

// Valid status transitions: 'fromStatus:toStatus' → required role
// 'any' = any authenticated user; 'manager' = manager only
const ALLOWED: Record<string, 'any' | 'manager'> = {
  'draft:submitted': 'any',
  'submitted:draft': 'any',      // withdraw
  'submitted:approved': 'manager',
  'submitted:rejected': 'manager',
  'approved:amended': 'manager', // triggered by manager PATCH
  'rejected:draft': 'any',       // employee re-saves a rejected entry
}

export function canTransition(current: string, next: string, role: string): TransitionResult {
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
