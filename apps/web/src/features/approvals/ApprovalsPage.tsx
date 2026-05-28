import { usersApi } from '@/features/projects/api'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ApprovalsList } from './components/ApprovalsList'
import { FilterBar } from './components/FilterBar'
import { RejectModal } from './components/RejectModal'
import { useApproveEntry, useApprovalQueue } from './hooks'

export function ApprovalsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('submitted')
  const [userFilter, setUserFilter] = useState('')
  const [fromFilter, setFromFilter] = useState('')
  const [toFilter, setToFilter] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const params = {
    status: statusFilter,
    ...(userFilter ? { userId: userFilter } : {}),
    ...(fromFilter ? { from: fromFilter } : {}),
    ...(toFilter ? { to: toFilter } : {}),
  }

  const { data: items = [], isLoading } = useApprovalQueue(params)
  const { data: activeUsers = [] } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: usersApi.listActive,
    staleTime: 60_000,
  })
  const approveEntry = useApproveEntry()

  const handleClearFilters = () => {
    setUserFilter('')
    setFromFilter('')
    setToFilter('')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-ink-1000 font-bold" style={{ fontSize: 22 }}>
            Approval queue
          </h1>
          {!isLoading && (
            <p className="text-ink-500 font-mono" style={{ fontSize: 12 }}>
              {items.length} {items.length === 1 ? 'entry' : 'entries'}
            </p>
          )}
        </div>
      </div>

      <FilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        userFilter={userFilter}
        onUserChange={setUserFilter}
        fromFilter={fromFilter}
        onFromChange={setFromFilter}
        toFilter={toFilter}
        onToChange={setToFilter}
        activeUsers={activeUsers}
        onClearFilters={handleClearFilters}
      />

      <ApprovalsList
        items={items}
        isLoading={isLoading}
        onApprove={(id) => approveEntry.mutate(id)}
        onReject={(id) => setRejectingId(id)}
        approvingId={approveEntry.variables ?? null}
        approvingStatus={approveEntry.isPending}
      />

      {rejectingId && (
        <RejectModal entryId={rejectingId} onClose={() => setRejectingId(null)} />
      )}
    </div>
  )
}
