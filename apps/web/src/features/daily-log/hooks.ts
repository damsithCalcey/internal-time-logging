import { timeEntriesApi } from '@/features/time-entries/api'
import { invalidateTimeEntry } from '@/shared/cache'
import type { UpdateTimeEntryBody } from '@repo/shared-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dailyLogApi } from './api'

export const dailyLogKeys = {
  all: ['daily-log'] as const,
  date: (date: string, userId?: string) =>
    [...dailyLogKeys.all, date, userId ?? 'self'] as const,
}

export function useDailyLog(date: string, userId?: string) {
  return useQuery({
    queryKey: dailyLogKeys.date(date, userId),
    queryFn: () => dailyLogApi.list(date, userId),
    staleTime: 30_000,
  })
}

export function useDailySubmit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => timeEntriesApi.submit(id),
    onSuccess: () => invalidateTimeEntry(qc),
  })
}

export function useDailyWithdraw() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => timeEntriesApi.withdraw(id),
    onSuccess: () => invalidateTimeEntry(qc),
  })
}

export function useDailyUpdateEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTimeEntryBody }) =>
      timeEntriesApi.update(id, body),
    onSuccess: () => invalidateTimeEntry(qc),
  })
}
