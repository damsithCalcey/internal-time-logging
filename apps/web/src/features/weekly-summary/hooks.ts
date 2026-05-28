import { useQuery } from '@tanstack/react-query'
import { weeklySummaryApi } from './api'

export const weeklySummaryKeys = {
  all: ['weekly-summary'] as const,
  week: (week: string, userId?: string) =>
    [...weeklySummaryKeys.all, week, userId ?? 'self'] as const,
}

export function useWeeklySummary(week: string, userId?: string) {
  return useQuery({
    queryKey: weeklySummaryKeys.week(week, userId),
    queryFn: () => weeklySummaryApi.list(week, userId),
    staleTime: 30_000,
  })
}
