import type { QueryClient } from '@tanstack/react-query'

export function invalidateTimeEntry(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: ['time-entries'] })
  qc.invalidateQueries({ queryKey: ['daily-log'] })
  qc.invalidateQueries({ queryKey: ['weekly-summary'] })
  qc.invalidateQueries({ queryKey: ['approvals'] })
}
