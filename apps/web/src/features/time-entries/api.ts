import { http } from '@/shared/http'
import type {
  CreateTimeEntryBody,
  TimeEntry,
  UpdateTimeEntryBody,
} from '@repo/shared-types'

export const timeEntriesApi = {
  list(params?: { user?: string; date?: string }): Promise<TimeEntry[]> {
    const q = new URLSearchParams()
    if (params?.user) q.set('user', params.user)
    if (params?.date) q.set('date', params.date)
    const qs = q.toString()
    return http.get(`/time-entries${qs ? `?${qs}` : ''}`)
  },

  get(id: string): Promise<TimeEntry> {
    return http.get(`/time-entries/${id}`)
  },

  create(body: CreateTimeEntryBody): Promise<TimeEntry> {
    return http.post('/time-entries', body)
  },

  update(id: string, body: UpdateTimeEntryBody): Promise<TimeEntry> {
    return http.patch(`/time-entries/${id}`, body)
  },

  submit(id: string): Promise<TimeEntry> {
    return http.post(`/time-entries/${id}/submit`)
  },

  withdraw(id: string): Promise<TimeEntry> {
    return http.post(`/time-entries/${id}/withdraw`)
  },
}
