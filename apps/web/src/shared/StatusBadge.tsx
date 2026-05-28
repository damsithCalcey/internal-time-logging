const STATUS_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-ink-100', text: 'text-ink-600' },
  submitted: { label: 'Submitted', bg: 'bg-blue-50', text: 'text-blue-700' },
  approved: { label: 'Approved', bg: 'bg-green-50', text: 'text-green-700' },
  rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700' },
  amended: { label: 'Amended', bg: 'bg-amber-50', text: 'text-amber-700' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE['draft']!
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono font-semibold uppercase ${s.bg} ${s.text}`}
      style={{ fontSize: 10, letterSpacing: '0.1em' }}
    >
      {s.label}
    </span>
  )
}
