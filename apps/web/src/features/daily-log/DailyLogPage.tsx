import { useAuth } from '@/features/auth/AuthProvider'
import { usersApi } from '@/features/projects/api'
import type { LogEntry } from '@repo/shared-types'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DateNavigator } from './components/DateNavigator'
import { EditModal } from './components/EditModal'
import { LogTable } from './components/LogTable'
import { UserFilter } from './components/UserFilter'
import { useDailyLog } from './hooks'

export function DailyLogPage() {
  const { user } = useAuth()
  const isManager = user?.role === 'manager'
  const today = format(new Date(), 'yyyy-MM-dd')
  const navigate = useNavigate()

  const [selectedDate, setSelectedDate] = useState(today)
  const [userFilter, setUserFilter] = useState('')
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null)

  const { data: entries = [], isLoading } = useDailyLog(
    selectedDate,
    isManager ? userFilter || undefined : undefined,
  )

  const { data: activeUsers = [] } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: usersApi.listActive,
    enabled: isManager,
    staleTime: 60_000,
  })

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateNavigator
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          totalHours={totalHours}
          isLoading={isLoading}
        />

        <button
          onClick={() => navigate('/app/entries')}
          className="bg-tropical-magenta inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white transition-colors hover:opacity-90"
          style={{ fontSize: 14 }}
        >
          <Plus size={16} />
          Log entry
        </button>
      </div>

      {/* Manager: user filter */}
      {isManager && (
        <UserFilter
          userFilter={userFilter}
          onUserFilterChange={setUserFilter}
          activeUsers={activeUsers}
        />
      )}

      {/* Table */}
      <LogTable
        entries={entries}
        isLoading={isLoading}
        dateLabel={format(new Date(`${selectedDate}T00:00:00`), 'EEEE, MMM d')}
        totalHours={totalHours}
        isManager={isManager}
        userId={user?.id}
        onEditEntry={setEditingEntry}
      />

      {/* Edit modal */}
      {editingEntry && <EditModal entry={editingEntry} onClose={() => setEditingEntry(null)} />}
    </div>
  )
}
