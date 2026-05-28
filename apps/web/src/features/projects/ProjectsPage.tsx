import { Layers } from 'lucide-react'
import { useState } from 'react'
import { CreateProjectModal } from './components/CreateProjectModal'
import { ProjectDetailPanel } from './components/ProjectDetailPanel'
import { ProjectList } from './components/ProjectList'
import { ProjectStatStrip } from './components/ProjectStatStrip'
import { useProjects, useProjectStats } from './hooks'

export function ProjectsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data: projects = [], isLoading } = useProjects()
  const { data: stats } = useProjectStats()

  const projectCount = stats?.projectCount ?? projects.length
  const taskCount = stats?.taskCount ?? projects.reduce((s, p) => s + p.taskCount, 0)
  const memberCount = stats?.memberCount ?? 0

  return (
    <div className="flex h-full flex-col gap-5" style={{ minHeight: 0 }}>
      <ProjectStatStrip
        projectCount={projectCount}
        taskCount={taskCount}
        memberCount={memberCount}
      />

      <div
        className="flex min-h-0 flex-1 gap-4"
        style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}
      >
        <ProjectList
          projects={projects}
          isLoading={isLoading}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
          onCreateClick={() => setShowCreate(true)}
        />

        <div
          className="overflow-hidden rounded-2xl bg-white"
          style={{ border: '1px solid var(--ink-200)', boxShadow: '0 1px 3px rgba(11,11,18,0.04)' }}
        >
          {selectedId ? (
            <ProjectDetailPanel key={selectedId} projectId={selectedId} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: 'var(--ink-100)' }}
              >
                <Layers size={22} className="text-ink-400" />
              </div>
              <div>
                <p className="font-display text-ink-700 font-semibold" style={{ fontSize: 14 }}>
                  Select a project
                </p>
                <p
                  className="font-display text-ink-400 mt-1"
                  style={{ fontSize: 13, lineHeight: 1.5 }}
                >
                  Click a project in the list to view its tasks and assigned team members.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
