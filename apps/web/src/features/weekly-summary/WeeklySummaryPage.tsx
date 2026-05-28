import { useAuth } from '@/features/auth/AuthProvider'
import { usersApi } from '@/features/projects/api'
import { useQuery } from '@tanstack/react-query'
import { startOfISOWeek } from 'date-fns'
import { useState } from 'react'
import { SummaryTable } from './components/SummaryTable'
import { UserFilter } from './components/UserFilter'
import { WeekNavigator } from './components/WeekNavigator'
import { useWeeklySummary } from './hooks'
import { formatWeekHeader, toWeekStr } from './utils'

export function WeeklySummaryPage() {
  const { user } = useAuth()
  const isManager = user?.role === 'manager'

  const [refDate, setRefDate] = useState(() => startOfISOWeek(new Date()))
  const [userFilter, setUserFilter] = useState('')
  const [groupBy, setGroupBy] = useState<'project' | 'task'>('project')

  const weekStr = toWeekStr(refDate)
  const weekHeader = formatWeekHeader(weekStr)

  const { data: entries = [], isLoading } = useWeeklySummary(
    weekStr,
    isManager ? userFilter || undefined : undefined,
  )

  const { data: activeUsers = [] } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: usersApi.listActive,
    enabled: isManager,
    staleTime: 60_000,
  })

  return (
    <div className="flex flex-col gap-6">
      <WeekNavigator
        refDate={refDate}
        onRefDateChange={setRefDate}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
      />

      {isManager && (
        <UserFilter
          userFilter={userFilter}
          onUserFilterChange={setUserFilter}
          activeUsers={activeUsers}
        />
      )}

      <SummaryTable
        entries={entries}
        isLoading={isLoading}
        weekStr={weekStr}
        groupBy={groupBy}
        weekHeader={weekHeader}
      />
    </div>
  )
}
