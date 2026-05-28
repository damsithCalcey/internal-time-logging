import { StatusBadge } from '@/shared/StatusBadge'
import type { ApprovalQueueItem } from '@repo/shared-types'
import { format } from 'date-fns'
import { Check, Clock, Loader2, X } from 'lucide-react'

interface ApprovalCardProps {
  item: ApprovalQueueItem
  onApprove: () => void
  onReject: () => void
  isApproving: boolean
}

export function ApprovalCard({
  item,
  onApprove,
  onReject,
  isApproving,
}: ApprovalCardProps) {
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
            <span className="text-ink-400" style={{ fontSize: 13 }}>
              ·
            </span>
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
              {item.amendedAt && ` on ${format(new Date(item.amendedAt), 'MMM d')}`}
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
