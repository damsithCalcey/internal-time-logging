import { http } from '@/shared/http'
import type { LogEntry } from '@repo/shared-types'

export const weeklySummaryApi = {
  list(week: string, userId?: string): Promise<LogEntry[]> {
    const q = new URLSearchParams({ week })
    if (userId) q.set('userId', userId)
    return http.get(`/time-entries/weekly?${q}`)
  },
}
