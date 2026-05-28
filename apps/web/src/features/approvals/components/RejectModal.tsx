import { Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { useRejectEntry } from '../hooks'

interface RejectModalProps {
  entryId: string
  onClose: () => void
}

export function RejectModal({ entryId, onClose }: RejectModalProps) {
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
