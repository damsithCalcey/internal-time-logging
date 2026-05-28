import { StatusBadge } from '@/shared/StatusBadge'
import type { LogEntry } from '@repo/shared-types'
import { Loader2, Pencil, Plus, SendHorizonal, Undo2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDailySubmit, useDailyWithdraw } from '../hooks'

export function LogTable({
  entries,
  isLoading,
  dateLabel,
  totalHours,
  isManager,
  userId,
  onEditEntry,
}: {
  entries: LogEntry[]
  isLoading: boolean
  dateLabel: string
  totalHours: number
  isManager: boolean
  userId: string | undefined
  onEditEntry: (entry: LogEntry) => void
}) {
  const navigate = useNavigate()
  const submit = useDailySubmit()
  const withdraw = useDailyWithdraw()

  if (isLoading) {
    return (
      <div
        className="border-ink-200 overflow-hidden rounded-2xl border bg-white"
        style={{ boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
      >
        <div className="text-ink-400 flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin" />
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div
        className="border-ink-200 overflow-hidden rounded-2xl border bg-white"
        style={{ boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
      >
        <div className="border-ink-100 flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-ink-400 text-sm">No entries for {dateLabel}</p>
          <button
            onClick={() => navigate('/app/entries')}
            className="bg-tropical-magenta inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold text-white transition-colors hover:opacity-90"
            style={{ fontSize: 13 }}
          >
            <Plus size={14} />
            Log entry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="border-ink-200 overflow-hidden rounded-2xl border bg-white"
      style={{ boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-ink-100 border-b">
              {isManager && (
                <th
                  className="text-ink-400 px-5 py-3 text-left font-mono uppercase"
                  style={{ fontSize: 11, letterSpacing: '0.1em' }}
                >
                  Employee
                </th>
              )}
              <th
                className="text-ink-400 py-3 pr-4 text-left font-mono uppercase"
                style={{ fontSize: 11, letterSpacing: '0.1em', paddingLeft: isManager ? 0 : 20 }}
              >
                Project / Task
              </th>
              <th
                className="text-ink-400 py-3 pr-4 text-left font-mono uppercase"
                style={{ fontSize: 11, letterSpacing: '0.1em' }}
              >
                Notes
              </th>
              <th
                className="text-ink-400 py-3 pr-4 text-left font-mono uppercase"
                style={{ fontSize: 11, letterSpacing: '0.1em' }}
              >
                Hours
              </th>
              <th
                className="text-ink-400 py-3 pr-4 text-left font-mono uppercase"
                style={{ fontSize: 11, letterSpacing: '0.1em' }}
              >
                Status
              </th>
              <th
                className="text-ink-400 py-3 pr-5 text-left font-mono uppercase"
                style={{ fontSize: 11, letterSpacing: '0.1em' }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="px-5">
            {entries.map((entry) => (
              <tr key={entry.id} className="border-ink-100 border-b last:border-b-0">
                {isManager && (
                  <td className="text-ink-700 py-3 pr-4 text-sm" style={{ paddingLeft: 20 }}>
                    {entry.userName}
                  </td>
                )}
                <td className="py-3 pr-4" style={{ paddingLeft: isManager ? 0 : 20 }}>
                  <p className="text-ink-1000 font-semibold" style={{ fontSize: 14 }}>
                    {entry.projectName}
                  </p>
                  <p className="text-ink-500 font-mono" style={{ fontSize: 12 }}>
                    {entry.taskName}
                  </p>
                </td>
                <td className="py-3 pr-4">
                  {entry.notes ? (
                    <p
                      className="text-ink-600 max-w-[200px] truncate"
                      style={{ fontSize: 13 }}
                      title={entry.notes}
                    >
                      {entry.notes}
                    </p>
                  ) : (
                    <span className="text-ink-300 text-sm">—</span>
                  )}
                  {entry.managerNote && (
                    <p
                      className="mt-0.5 max-w-[200px] truncate text-xs text-red-500 italic"
                      title={entry.managerNote}
                    >
                      {entry.managerNote}
                    </p>
                  )}
                  {entry.status === 'amended' && entry.originalHours != null && (
                    <p className="text-ink-400 mt-0.5 text-xs">
                      Amended · was {entry.originalHours}h
                    </p>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span className="text-ink-1000 font-mono font-semibold" style={{ fontSize: 14 }}>
                    {entry.hours}h
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={entry.status} />
                </td>
                <td className="py-3 pr-5">
                  {(() => {
                    const isOwn = entry.userId === userId
                    const canEdit = isOwn && ['draft', 'rejected'].includes(entry.status)
                    const canSubmit = isOwn && entry.status === 'draft'
                    const canWithdraw = isOwn && entry.status === 'submitted'
                    return (
                      <div className="flex items-center gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => onEditEntry(entry)}
                            className="border-ink-200 text-ink-600 hover:bg-ink-50 hover:text-ink-1000 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 transition-colors"
                            style={{ fontSize: 12 }}
                          >
                            <Pencil size={12} />
                            Edit
                          </button>
                        )}
                        {canSubmit && (
                          <button
                            onClick={() => submit.mutate(entry.id)}
                            disabled={submit.isPending && submit.variables === entry.id}
                            className="bg-ink-1000 hover:bg-ink-800 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-white transition-colors disabled:opacity-50"
                            style={{ fontSize: 12 }}
                          >
                            {submit.isPending && submit.variables === entry.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <SendHorizonal size={12} />
                            )}
                            Submit
                          </button>
                        )}
                        {canWithdraw && (
                          <button
                            onClick={() => withdraw.mutate(entry.id)}
                            disabled={withdraw.isPending && withdraw.variables === entry.id}
                            className="border-ink-200 text-ink-600 hover:bg-ink-50 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 transition-colors disabled:opacity-50"
                            style={{ fontSize: 12 }}
                          >
                            {withdraw.isPending && withdraw.variables === entry.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Undo2 size={12} />
                            )}
                            Withdraw
                          </button>
                        )}
                      </div>
                    )
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
          {/* Total footer */}
          <tfoot>
            <tr className="border-ink-100 bg-ink-50 border-t">
              <td colSpan={isManager ? 3 : 2} className="px-5 py-3 text-right" />
              <td className="py-3 pr-4">
                <span className="text-ink-1000 font-mono font-bold" style={{ fontSize: 14 }}>
                  {totalHours}h
                </span>
              </td>
              <td colSpan={2} className="py-3 pr-5">
                <span
                  className="text-ink-400 font-mono uppercase"
                  style={{ fontSize: 10, letterSpacing: '0.1em' }}
                >
                  Total
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
