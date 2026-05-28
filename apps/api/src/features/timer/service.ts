import * as timerSessionsRepo from '@/db/repositories/timer-sessions.js'
import type { Tx } from '@/db/tx.js'

// Called by admin-users/service via the acyclic service graph (§1.3)
// Sets status='discarded' (NOT 'stopped') — deactivated users must not face a ghost pending-save
// modal on next login (§1.5, D0-10).
export async function discardActiveSessionFor(tx: Tx, userId: string): Promise<void> {
  await timerSessionsRepo.discardActiveFor(tx, userId)
}
