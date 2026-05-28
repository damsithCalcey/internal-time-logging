import { invalidateTimeEntry } from '@/shared/cache'
import type { CreateTimeEntryBody, UpdateTimeEntryBody } from '@repo/shared-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { timeEntriesApi } from './api'

export const entryKeys = {
  all: ['time-entries'] as const,
  list: (userId: string | undefined, date: string | undefined) =>
    [...entryKeys.all, 'list', userId ?? 'me', date ?? 'all'] as const,
  detail: (id: string) => [...entryKeys.all, 'detail', id] as const,
}

export function useTimeEntries(date?: string, userId?: string) {
  return useQuery({
    queryKey: entryKeys.list(userId, date),
    queryFn: () => {
      const params: { user?: string; date?: string } = {}
      if (userId) params.user = userId
      if (date) params.date = date
      return timeEntriesApi.list(params)
    },
  })
}

export function useCreateTimeEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTimeEntryBody) => timeEntriesApi.create(body),
    onSuccess: () => {
      invalidateTimeEntry(qc)
    },
  })
}

export function useUpdateTimeEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTimeEntryBody }) =>
      timeEntriesApi.update(id, body),
    onSuccess: () => {
      invalidateTimeEntry(qc)
    },
  })
}

export function useSubmitEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => timeEntriesApi.submit(id),
    onSuccess: () => {
      invalidateTimeEntry(qc)
    },
  })
}

export function useWithdrawEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => timeEntriesApi.withdraw(id),
    onSuccess: () => {
      invalidateTimeEntry(qc)
    },
  })
}
