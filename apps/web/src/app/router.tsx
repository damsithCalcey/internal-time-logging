import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { RequireRole } from '@/features/auth/RequireRole'
import { ProjectsPage } from '@/features/projects'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from './shell/AppShell'

function Placeholder({ title, stage }: { title: string; stage: number }) {
  return (
    <div className="flex flex-col gap-2 py-8">
      <h2
        className="font-display font-bold text-ink-1000"
        style={{ fontSize: 24, letterSpacing: '-0.01em' }}
      >
        {title}
      </h2>
      <p className="text-ink-500" style={{ fontSize: 14 }}>
        Coming in Stage {stage}. The app shell, auth, and navigation are working.
      </p>
    </div>
  )
}

export const router = createBrowserRouter([
  // Root → app
  { path: '/', element: <Navigate to="/app" replace /> },

  // Login
  { path: '/login', element: <LoginPage /> },

  // Authenticated shell
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/app/daily" replace /> },

      // Employee routes
      {
        path: 'daily',
        handle: { title: 'Daily log' },
        element: <Placeholder title="Daily log" stage={6} />,
      },
      {
        path: 'weekly',
        handle: { title: 'Weekly summary' },
        element: <Placeholder title="Weekly summary" stage={6} />,
      },
      {
        path: 'entries',
        handle: { title: 'My entries' },
        element: <Placeholder title="My entries" stage={4} />,
      },

      // Manager-only routes
      {
        path: 'approvals',
        handle: { title: 'Approval queue' },
        element: (
          <RequireRole role="manager">
            <Placeholder title="Approval queue" stage={5} />
          </RequireRole>
        ),
      },
      {
        path: 'projects',
        handle: { title: 'Projects' },
        element: (
          <RequireRole role="manager">
            <ProjectsPage />
          </RequireRole>
        ),
      },
      {
        path: 'team',
        handle: { title: 'Team' },
        element: (
          <RequireRole role="manager">
            <Placeholder title="Team" stage={4} />
          </RequireRole>
        ),
      },
    ],
  },

  // Catch-all
  { path: '*', element: <Navigate to="/app" replace /> },
])
