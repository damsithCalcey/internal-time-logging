function StatCard({
  label,
  value,
  dark,
}: {
  label: string
  value: string | number
  dark?: boolean
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-2xl px-5 py-4"
      style={{
        background: dark ? 'var(--ink-1000)' : '#fff',
        border: dark ? 'none' : '1px solid var(--ink-200)',
        boxShadow: dark ? 'none' : '0 1px 3px rgba(11,11,18,0.04)',
        minWidth: 0,
      }}
    >
      <p
        className="font-mono font-semibold uppercase"
        style={{
          fontSize: 10.5,
          letterSpacing: '0.14em',
          color: dark ? 'rgba(255,255,255,0.55)' : 'var(--ink-500)',
        }}
      >
        {label}
      </p>
      <p
        className="font-display font-black"
        style={{
          fontSize: 36,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: dark ? 'var(--tropical-magenta)' : 'var(--ink-1000)',
        }}
      >
        {value}
      </p>
    </div>
  )
}

export function ProjectStatStrip({
  projectCount,
  taskCount,
  memberCount,
}: {
  projectCount: number
  taskCount: number
  memberCount: number
}) {
  return (
    <div className="grid grid-cols-4 gap-4" style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr' }}>
      <StatCard label="Active projects" value={projectCount} dark />
      <StatCard label="Tasks" value={taskCount} />
      <StatCard label="Team members" value={memberCount} />
      <StatCard label="Logged this wk" value="—" />
    </div>
  )
}
