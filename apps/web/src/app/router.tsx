import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { RequireRole } from '@/features/auth/RequireRole'
import { ApprovalsPage } from '@/features/approvals'
import { DailyLogPage } from '@/features/daily-log'
import { ProjectsPage } from '@/features/projects'
import { TimeEntriesPage } from '@/features/time-entries'
import { TeamPage } from '@/features/admin-users'
import { WeeklySummaryPage } from '@/features/weekly-summary'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ErrorPage } from './ErrorPage'
import { AppShell } from './shell/AppShell'

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
        element: <DailyLogPage />,
      },
      {
        path: 'weekly',
        handle: { title: 'Weekly summary' },
        element: <WeeklySummaryPage />,
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
