import type { ProjectListItem } from '@repo/shared-types'
import { ChevronRight, Folder, Plus } from 'lucide-react'
import { initials, projectCode, projectColor } from '../utils'

function AvatarStack({ count, names }: { count: number; names: string[] }) {
  const visible = names.slice(0, 3)
  const extra = count - visible.length
  return (
    <span className="flex items-center">
      {visible.map((n, i) => (
        <span
          key={n}
          className="font-display flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-white font-bold text-white"
          style={{ fontSize: 8, background: 'var(--ink-500)', marginLeft: i === 0 ? 0 : -6 }}
          title={n}
        >
          {initials(n)}
        </span>
      ))}
      {extra > 0 && (
        <span
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-white font-mono font-semibold"
          style={{
            fontSize: 8,
            background: 'var(--ink-200)',
            color: 'var(--ink-600)',
            marginLeft: -6,
          }}
        >
          +{extra}
        </span>
      )}
    </span>
  )
}

function ProjectRow({
  project,
  selected,
  onClick,
}: {
  project: ProjectListItem
  selected: boolean
  onClick: () => void
}) {
  const color = projectColor(project.id)
  const code = projectCode(project.name)

  return (
    <tr
      onClick={onClick}
      className="group cursor-pointer transition-colors"
      style={{ background: selected ? 'var(--magenta-100)' : undefined }}
    >
      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--ink-100)' }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg font-mono font-bold text-white"
            style={{ background: color, fontSize: 9, letterSpacing: '0.05em' }}
          >
            {code}
          </div>
          <div>
            <p
              className="font-display text-ink-900 group-hover:text-ink-1000 font-semibold transition-colors"
              style={{ fontSize: 13.5 }}
            >
              {project.name}
            </p>
            <p
              className="text-ink-400 font-mono uppercase"
              style={{ fontSize: 9.5, letterSpacing: '0.12em' }}
            >
              Active
            </p>
          </div>
        </div>
      </td>
      <td
        className="px-3 py-3 text-right"
        style={{ borderBottom: '1px solid var(--ink-100)', width: 70 }}
      >
        <span className="font-display text-ink-900 font-bold" style={{ fontSize: 16 }}>
          {project.taskCount}
        </span>
      </td>
      <td className="px-3 py-3" style={{ borderBottom: '1px solid var(--ink-100)', width: 80 }}>
        <AvatarStack count={project.memberCount} names={[]} />
      </td>
      <td
        className="px-3 py-3 text-right"
        style={{ borderBottom: '1px solid var(--ink-100)', width: 36 }}
      >
        <ChevronRight
          size={14}
          className="text-ink-300 group-hover:text-ink-500 transition-colors"
        />
      </td>
    </tr>
  )
}

export function ProjectList({
  projects,
  isLoading,
  selectedId,
  onSelect,
  onCreateClick,
}: {
  projects: ProjectListItem[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onCreateClick: () => void
}) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl bg-white"
      style={{ border: '1px solid var(--ink-200)', boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
    >
      <div
        className="flex flex-shrink-0 items-center justify-between px-4 py-3.5"
        style={{ borderBottom: '1px solid var(--ink-100)' }}
      >
        <h4 className="font-display text-ink-1000 font-bold" style={{ fontSize: 14 }}>
          All projects
        </h4>
        <button
          onClick={onCreateClick}
          className="font-display flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold text-white transition-opacity hover:opacity-90"
          style={{ fontSize: 12.5, background: 'var(--tropical-magenta)' }}
        >
          <Plus size={13} /> New project
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-ink-400 flex h-32 items-center justify-center">
            <p className="font-display" style={{ fontSize: 14 }}>
              Loading projects…
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-3">
            <Folder size={32} className="text-ink-300" />
            <div className="text-center">
              <p className="font-display text-ink-700 font-semibold" style={{ fontSize: 14 }}>
                No projects yet
              </p>
              <p className="font-display text-ink-400" style={{ fontSize: 13 }}>
                Create your first project to get started.
              </p>
            </div>
            <button
              onClick={onCreateClick}
              className="font-display mt-1 flex items-center gap-1.5 rounded-full px-4 py-2 font-semibold text-white"
              style={{ fontSize: 13, background: 'var(--tropical-magenta)' }}
            >
              <Plus size={13} /> Create project
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--ink-50)' }}>
                <th
                  className="text-ink-500 px-4 py-2.5 text-left font-mono font-semibold uppercase"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    borderBottom: '1px solid var(--ink-100)',
                  }}
                >
                  Project
                </th>
                <th
                  className="text-ink-500 px-3 py-2.5 text-right font-mono font-semibold uppercase"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    borderBottom: '1px solid var(--ink-100)',
                    width: 70,
                  }}
                >
                  Tasks
                </th>
                <th
                  className="text-ink-500 px-3 py-2.5 font-mono font-semibold uppercase"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    borderBottom: '1px solid var(--ink-100)',
                    width: 80,
                  }}
                >
                  Members
                </th>
                <th style={{ width: 36, borderBottom: '1px solid var(--ink-100)' }} />
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  selected={project.id === selectedId}
                  onClick={() => onSelect(project.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
