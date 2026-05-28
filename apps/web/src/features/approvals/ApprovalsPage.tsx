import { usersApi } from '@/features/projects/api'
import { StatusBadge } from '@/shared/StatusBadge'
import type { ApprovalQueueItem } from '@repo/shared-types'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Check, Clock, Filter, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { useApproveEntry, useApprovalQueue, useRejectEntry } from './hooks'

// ── Reject modal ──────────────────────────────────────────────────

function RejectModal({
  entryId,
  onClose,
}: {
  entryId: string
  onClose: () => void
}) {
  const [note, setNote] = useState('')
  const reject = useRejectEntry()

  const handleConfirm = async () => {
    if (!note.trim()) return
    try {
      await reject.mutateAsync({ id: entryId, note: note.trim() })
      onClose()
    } catch {
      // error surfaced via mutation state
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="border-ink-200 w-full max-w-md rounded-2xl border bg-white p-6"
        style={{ boxShadow: '0 8px 32px rgba(11,11,18,0.16)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-ink-1000 font-bold" style={{ fontSize: 16 }}>
            Reject entry
          </h3>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 rounded-lg p-1 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4">
          <label
            className="text-ink-500 mb-1 block font-mono uppercase"
            style={{ fontSize: 11, letterSpacing: '0.1em' }}
          >
            Reason for rejection
          </label>
          <textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explain why this entry is being rejected…"
            className="field-input w-full resize-none rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-1000 outline-none transition-colors placeholder:text-ink-400 focus:border-tropical-magenta focus:ring-2 focus:ring-tropical-magenta/20"
            autoFocus
          />
          {reject.error && (
            <p className="mt-1 text-xs text-red-600">{reject.error.message}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={!note.trim() || reject.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            style={{ fontSize: 14 }}
          >
            {reject.isPending && <Loader2 size={14} className="animate-spin" />}
            Reject entry
          </button>
          <button
            onClick={onClose}
            className="border-ink-200 text-ink-700 hover:bg-ink-50 rounded-xl border px-4 py-2.5 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Entry card ────────────────────────────────────────────────────

function ApprovalCard({
  item,
  onApprove,
  onReject,
  isApproving,
}: {
  item: ApprovalQueueItem
  onApprove: () => void
  onReject: () => void
  isApproving: boolean
}) {
  const canAct = item.status === 'submitted'

  return (
    <div
      className="border-ink-200 rounded-2xl border bg-white px-5 py-4"
      style={{ boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* User + date */}
          <div className="mb-1 flex items-center gap-2">
            <p className="font-display text-ink-1000 font-semibold" style={{ fontSize: 15 }}>
              {item.userName}
            </p>
            <span className="text-ink-400" style={{ fontSize: 13 }}>·</span>
            <span className="text-ink-500 font-mono" style={{ fontSize: 12 }}>
              {format(new Date(`${item.entryDate}T00:00:00`), 'MMM d, yyyy')}
            </span>
          </div>

          {/* Project / task */}
          <p className="text-ink-700" style={{ fontSize: 14 }}>
            {item.projectName}
          </p>
          <p className="text-ink-500 font-mono" style={{ fontSize: 12 }}>
            {item.taskName}
          </p>

          {/* Notes */}
          {item.notes && (
            <p className="text-ink-600 mt-1.5 line-clamp-2" style={{ fontSize: 13 }}>
              {item.notes}
            </p>
          )}

          {/* Manager note (rejected entries) */}
          {item.managerNote && (
            <p className="mt-1.5 text-xs text-red-600 italic">"{item.managerNote}"</p>
          )}

          {/* Amendment info */}
          {item.status === 'amended' && item.originalHours != null && (
            <p className="text-ink-400 mt-1.5 text-xs">
              Amended by {item.amendedByName ?? 'manager'} — original: {item.originalHours}h
              {item.amendedAt &&
                ` on ${format(new Date(item.amendedAt), 'MMM d')}`}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-1">
            <Clock size={13} className="text-ink-400" />
            <span className="text-ink-1000 font-mono font-semibold" style={{ fontSize: 15 }}>
              {item.hours}h
            </span>
          </div>
          <StatusBadge status={item.status} />
        </div>
      </div>

      {/* Actions (only for submitted entries) */}
      {canAct && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={onApprove}
            disabled={isApproving}
            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            style={{ fontSize: 13 }}
          >
            {isApproving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Check size={13} />
            )}
            Approve
          </button>
          <button
            onClick={onReject}
            className="border-ink-200 text-ink-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 transition-colors"
            style={{ fontSize: 13 }}
          >
            <X size={13} />
            Reject
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'amended', label: 'Amended' },
] as const

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

  const inputClass =
    'field-input rounded-xl border border-ink-200 bg-white px-3 py-2 text-ink-1000 text-sm outline-none transition-colors placeholder:text-ink-400 focus:border-tropical-magenta focus:ring-2 focus:ring-tropical-magenta/20'

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

      {/* Filters */}
      <div
        className="border-ink-200 flex flex-wrap items-end gap-3 rounded-2xl border bg-white px-5 py-4"
        style={{ boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
      >
        <Filter size={14} className="text-ink-400 mb-2.5 shrink-0" />

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-ink-400 font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* User */}
        <div className="flex flex-col gap-1">
          <label className="text-ink-400 font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
            Employee
          </label>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className={inputClass}
          >
            <option value="">All employees</option>
            {activeUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Date from */}
        <div className="flex flex-col gap-1">
          <label className="text-ink-400 font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
            From
          </label>
          <input
            type="date"
            value={fromFilter}
            onChange={(e) => setFromFilter(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1">
          <label className="text-ink-400 font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
            To
          </label>
          <input
            type="date"
            value={toFilter}
            onChange={(e) => setToFilter(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Clear filters */}
        {(userFilter || fromFilter || toFilter) && (
          <button
            onClick={() => {
              setUserFilter('')
              setFromFilter('')
              setToFilter('')
            }}
            className="border-ink-200 text-ink-500 hover:bg-ink-50 mb-0.5 self-end rounded-xl border px-3 py-2 text-sm transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Entry list */}
      {isLoading ? (
        <div className="text-ink-400 flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="border-ink-200 rounded-2xl border border-dashed py-16 text-center">
          <p className="text-ink-400 text-sm">No entries match the current filters</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <ApprovalCard
              key={item.id}
              item={item}
              onApprove={() => approveEntry.mutate(item.id)}
              onReject={() => setRejectingId(item.id)}
              isApproving={approveEntry.isPending && approveEntry.variables === item.id}
            />
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectingId && (
        <RejectModal
          entryId={rejectingId}
          onClose={() => setRejectingId(null)}
        />
      )}
    </div>
  )
}
