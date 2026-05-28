import { http } from '@/shared/http'
import type { LogEntry } from '@repo/shared-types'

export const dailyLogApi = {
  list(date: string, userId?: string): Promise<LogEntry[]> {
    const q = new URLSearchParams({ date })
    if (userId) q.set('userId', userId)
    return http.get(`/time-entries/daily?${q}`)
  },
}
