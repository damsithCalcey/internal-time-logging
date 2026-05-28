import { http } from '@/shared/http'
import type { ApprovalQueueItem, RejectBody, TimeEntry } from '@repo/shared-types'

export type ApprovalQueueParams = {
  status?: string
  userId?: string
  from?: string
  to?: string
}

export const approvalsApi = {
  list(params?: ApprovalQueueParams): Promise<ApprovalQueueItem[]> {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.userId) q.set('userId', params.userId)
    if (params?.from) q.set('from', params.from)
    if (params?.to) q.set('to', params.to)
    const qs = q.toString()
    return http.get(`/approvals${qs ? `?${qs}` : ''}`)
  },

  approve(id: string): Promise<TimeEntry> {
    return http.post(`/approvals/${id}/approve`)
  },

  reject(id: string, body: RejectBody): Promise<TimeEntry> {
    return http.post(`/approvals/${id}/reject`, body)
  },
}
