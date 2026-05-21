import { Routes, Route, Navigate } from 'react-router-dom'

// Feature Pages (Imports từ Public APIs)
import { LoginPage, RegisterPage } from '@features/auth'
import { DashboardPage, ContributionPage, AcceptInvitePage } from '@features/workspace'
import UseCasePage from '@features/requirement/pages/UseCasePage'
import UseCaseDetailPage from '@features/requirement/pages/UseCaseDetailPage'
import EvidenceListPage from '@features/evidence/pages/EvidenceListPage'
import EvidenceDetailPage from '@features/evidence/pages/EvidenceDetailPage'
import TestCasePage from '@features/testing/pages/TestCasePage'
import TestCaseDetailPage from '@features/testing/pages/TestCaseDetailPage'

// Shared Components
import NotFoundPage from '@components/feedback/NotFoundPage'
import AppLayout from '@components/layout/AppLayout'

// Route Guard
import PrivateRoute from './PrivateRoute'

/**
 * Định tuyến tập trung của toàn ứng dụng (Centralized Routing)
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/invite/accept" element={<AcceptInvitePage />} />

      {/* 2. Protected Routes (Yêu cầu đăng nhập, sử dụng AppLayout làm khung chung) */}
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Module 2: Requirement & Use Case Management */}
          <Route path="/use-cases" element={<UseCasePage />} />
          <Route path="/use-cases/:id" element={<UseCaseDetailPage />} />

          {/* Module 3: Team Contribution */}
          <Route path="/contribution" element={<ContributionPage />} />

          {/* Module 5: Evidence Vault */}
          <Route path="/evidence" element={<EvidenceListPage />} />
          <Route path="/evidence/:id" element={<EvidenceDetailPage />} />

          {/* Module 4: Test Case Management */}
          <Route path="/test-cases" element={<TestCasePage />} />
          <Route path="/test-cases/:id" element={<TestCaseDetailPage />} />

          {/* Các route của module tính năng khác sẽ được bổ sung tại đây khi phát triển */}
        </Route>
      </Route>

      {/* 3. Redirect & 404 Pages */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
