import { useState } from 'react'
import { Outlet, useMatches } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { MobileDrawer } from './MobileDrawer'

interface RouteHandle {
  title?: string
}

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Derive the current page title from the deepest matching route's handle
  const matches = useMatches()
  const currentTitle = matches
    .map((m) => (m.handle as RouteHandle | undefined)?.title)
    .filter(Boolean)
    .at(-1) ?? 'Calcey Hours'

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — hidden below md */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-ink-50">
        {/* Top bar */}
        <header
          className="flex items-center gap-4 px-7 h-16 flex-shrink-0 z-10"
          style={{
            background: 'rgba(255,255,255,0.78)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--ink-200)',
          }}
        >
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex-shrink-0 w-9 h-9 rounded-[10px] border border-ink-200 bg-white flex items-center justify-center text-ink-700"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <div className="flex-1 min-w-0">
            <h1
              className="font-display font-bold text-ink-1000 truncate"
              style={{ fontSize: 18, letterSpacing: '-0.01em' }}
            >
              {currentTitle}
            </h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ padding: '24px 28px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
