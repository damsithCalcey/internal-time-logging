import { timerSessionsRepo } from '@/db/repositories/index.js'
import type { Tx } from '@/db/tx.js'

// Cross-use-case: called by useCases/users/commands when deactivating a user.
// Sets status='discarded' (NOT 'stopped') — deactivated users must not face a ghost pending-save
// modal on next login (§1.5, D0-10).
export async function discardActiveSessionFor(tx: Tx, userId: string): Promise<void> {
  await timerSessionsRepo.discardActiveFor(tx, userId)
}
