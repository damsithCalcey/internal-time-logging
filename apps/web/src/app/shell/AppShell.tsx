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
  const currentTitle =
    matches
      .map((m) => (m.handle as RouteHandle | undefined)?.title)
      .filter(Boolean)
      .at(-1) ?? 'Calcey Hours'

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — hidden below md */}
      <div className="hidden flex-shrink-0 md:flex">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main content area */}
      <div className="bg-ink-50 flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="z-10 flex h-16 flex-shrink-0 items-center gap-4 px-7"
          style={{
            background: 'rgba(255,255,255,0.78)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--ink-200)',
          }}
        >
          {/* Hamburger — mobile only */}
          <button
            className="border-ink-200 text-ink-700 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border bg-white md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0 flex-1">
            <h1
              className="font-display text-ink-1000 truncate font-bold"
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
