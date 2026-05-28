export function RoleBadge({ role }: { role: string }) {
  const isManager = role === 'manager'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono font-semibold uppercase ${
        isManager
          ? 'bg-tropical-magenta/10 text-tropical-magenta'
          : 'bg-ink-100 text-ink-600'
      }`}
      style={{ fontSize: 10, letterSpacing: '0.1em' }}
    >
      {role}
    </span>
  )
}
