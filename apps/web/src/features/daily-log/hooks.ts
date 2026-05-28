import { timeEntriesApi } from '@/features/time-entries/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UpdateTimeEntryBody } from '@repo/shared-types'
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

function useInvalidateAll() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['time-entries'] })
    qc.invalidateQueries({ queryKey: dailyLogKeys.all })
    qc.invalidateQueries({ queryKey: ['weekly-summary'] })
  }
}

export function useDailySubmit() {
  const invalidateAll = useInvalidateAll()
  return useMutation({
    mutationFn: (id: string) => timeEntriesApi.submit(id),
    onSuccess: invalidateAll,
  })
}

export function useDailyWithdraw() {
  const invalidateAll = useInvalidateAll()
  return useMutation({
    mutationFn: (id: string) => timeEntriesApi.withdraw(id),
    onSuccess: invalidateAll,
  })
}

export function useDailyUpdateEntry() {
  const invalidateAll = useInvalidateAll()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTimeEntryBody }) =>
      timeEntriesApi.update(id, body),
    onSuccess: invalidateAll,
  })
}
