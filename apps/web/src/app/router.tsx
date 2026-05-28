import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { RequireRole } from '@/features/auth/RequireRole'
import { ApprovalsPage } from '@/features/approvals'
import { ProjectsPage } from '@/features/projects'
import { TimeEntriesPage } from '@/features/time-entries'
import { TeamPage } from '@/features/admin-users'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ErrorPage } from './ErrorPage'
import { AppShell } from './shell/AppShell'

function Placeholder({ title, stage }: { title: string; stage: number }) {
  return (
    <div className="flex flex-col gap-2 py-8">
      <h2
        className="font-display text-ink-1000 font-bold"
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
  { path: '/login', element: <LoginPage />, errorElement: <ErrorPage /> },

  // Authenticated shell
  {
    path: '/app',
    errorElement: <ErrorPage />,
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
        element: <TimeEntriesPage />,
      },

      // Manager-only routes
      {
        path: 'approvals',
        handle: { title: 'Approval queue' },
        element: (
          <RequireRole role="manager">
            <ApprovalsPage />
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
            <TeamPage />
          </RequireRole>
        ),
      },
    ],
  },

  // Catch-all
  { path: '*', element: <Navigate to="/app" replace /> },
])
