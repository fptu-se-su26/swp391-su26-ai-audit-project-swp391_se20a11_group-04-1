import { Routes, Route, Navigate } from 'react-router-dom'

// Feature Pages - Auth
import LoginPage from '@features/auth/pages/LoginPage'
import RegisterPage from '@features/auth/pages/RegisterPage'

// Feature Pages - Workspace & Dashboard
import DashboardPage from '@features/workspace/pages/DashboardPage'
import ContributionPage from '@features/workspace/pages/ContributionPage'
import AcceptInvitePage from '@features/workspace/pages/AcceptInvitePage'

// Feature Pages - Requirements
import RequirementsPage from '@features/requirement/pages/RequirementsPage'
import RequirementDetailPage from '@features/requirement/pages/RequirementDetailPage'

// Feature Pages - Use Cases
import UseCasePage from '@features/requirement/pages/UseCasePage'
import UseCaseDetailPage from '@features/requirement/pages/UseCaseDetailPage'
import { KanbanBoardPage, TaskDetailPage, MyTasksPage } from '@features/kanban'
import { SprintPage } from '@features/sprint'

// Feature Pages - Test Cases
import TestCasePage from '@features/testing/pages/TestCasePage'
import TestCaseDetailPage from '@features/testing/pages/TestCaseDetailPage'

// Feature Pages - Evidence
import EvidenceListPage from '@features/evidence/pages/EvidenceListPage'
import EvidenceDetailPage from '@features/evidence/pages/EvidenceDetailPage'

// Feature Pages - RTM
import RtmPage from '@features/rtm/pages/RtmPage'

// Layouts
import MainLayout from '@components/layout/MainLayout'
import ProjectLayout from '@components/layout/ProjectLayout'

// Shared Feedback Components
import NotFoundPage from '@components/feedback/NotFoundPage'

// Route Guards
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
      <Route path="/accept-invite" element={<AcceptInvitePage />} />

      {/* 2. Protected Routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          {/* Main Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* 3. Project Routes (Wrapped in ProjectLayout) */}
          <Route path="/projects/:projectId" element={<ProjectLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            
            {/* Module 1: Requirements Management */}
            <Route path="requirements" element={<RequirementsPage />} />
            <Route path="requirements/:id" element={<RequirementDetailPage />} />
            
            {/* Module 2: Use Case Management */}
            <Route path="use-cases" element={<UseCasePage />} />
            <Route path="use-cases/:id" element={<UseCaseDetailPage />} />
            
            {/* Module 3: Test Case Management */}
            <Route path="test-cases" element={<TestCasePage />} />
            <Route path="test-cases/:id" element={<TestCaseDetailPage />} />
            
            {/* Module 4: Evidence Vault */}
            <Route path="evidence" element={<EvidenceListPage />} />
            <Route path="evidence/:id" element={<EvidenceDetailPage />} />
            
            {/* Module 5: Team Contribution */}
            <Route path="contribution" element={<ContributionPage />} />

            {/* Module 6: Task Board */}
            <Route path="task-board" element={<KanbanBoardPage />} />
            <Route path="tasks/:id" element={<TaskDetailPage />} />
            <Route path="my-tasks" element={<MyTasksPage />} />
            <Route path="sprints" element={<SprintPage />} />

            {/* Module 6: Traceability Matrix */}
            <Route path="traceability-matrix" element={<RtmPage />} />
            
          </Route>
        </Route>
      </Route>

      {/* 4. Redirect & 404 Pages */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes

