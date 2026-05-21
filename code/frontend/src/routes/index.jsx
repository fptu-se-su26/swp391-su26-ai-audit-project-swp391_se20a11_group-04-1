import { Routes, Route, Navigate } from 'react-router-dom'

// Feature Pages (Imports from Public APIs)
import { LoginPage, RegisterPage } from '@features/auth'
import { DashboardPage, ContributionPage, AcceptInvitePage } from '@features/workspace'
import { RtmPage } from '@features/rtm'
import UseCasePage from '@features/requirement/pages/UseCasePage'
import UseCaseDetailPage from '@features/requirement/pages/UseCaseDetailPage'

// Shared Components
import NotFoundPage from '@components/feedback/NotFoundPage'
import AppLayout from '@components/layout/AppLayout'

// Route Guard
import PrivateRoute from './PrivateRoute'

/**
 * Centralized routing for the application.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/invite/accept" element={<AcceptInvitePage />} />

      {/* 2. Protected Routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Module 2: Requirement & Use Case Management */}
          <Route path="/use-cases" element={<UseCasePage />} />
          <Route path="/use-cases/:id" element={<UseCaseDetailPage />} />

          {/* Module 3: Team Contribution */}
          <Route path="/contribution" element={<ContributionPage />} />

          {/* Module 6: Requirement Traceability Matrix */}
          <Route path="/traceability-matrix" element={<RtmPage />} />
        </Route>
      </Route>

      {/* 3. Redirect & 404 Pages */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
