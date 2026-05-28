import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApprovalQueueParams } from './api'
import { approvalsApi } from './api'

export const approvalKeys = {
  all: ['approvals'] as const,
  list: (params: ApprovalQueueParams) => [...approvalKeys.all, 'list', params] as const,
}

export function useApprovalQueue(params: ApprovalQueueParams = {}) {
  return useQuery({
    queryKey: approvalKeys.list(params),
    queryFn: () => approvalsApi.list(params),
  })
}

export function useApproveEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approvalsApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: approvalKeys.all })
      // also invalidate time-entries so the employee's view refreshes
      qc.invalidateQueries({ queryKey: ['time-entries'] })
    },
  })
}

export function useRejectEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      approvalsApi.reject(id, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: approvalKeys.all })
      qc.invalidateQueries({ queryKey: ['time-entries'] })
    },
  })
}
