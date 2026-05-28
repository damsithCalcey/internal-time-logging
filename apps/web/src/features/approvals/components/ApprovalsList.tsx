import type { ApprovalQueueItem } from '@repo/shared-types'
import { Loader2 } from 'lucide-react'
import { ApprovalCard } from './ApprovalCard'

interface ApprovalsListProps {
  items: ApprovalQueueItem[]
  isLoading: boolean
  onApprove: (itemId: string) => void
  onReject: (itemId: string) => void
  approvingId: string | null
  approvingStatus?: boolean
}

export function ApprovalsList({
  items,
  isLoading,
  onApprove,
  onReject,
  approvingId,
  approvingStatus,
}: ApprovalsListProps) {
  return (
    <>
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
              onApprove={() => onApprove(item.id)}
              onReject={() => onReject(item.id)}
              isApproving={approvingId === item.id && !!approvingStatus}
            />
          ))}
        </div>
      )}
    </>
  )
}
