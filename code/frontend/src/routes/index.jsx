import { Routes, Route, Navigate } from 'react-router-dom'

// Feature Pages - Auth
import LoginPage from '@features/auth/pages/LoginPage'
import RegisterPage from '@features/auth/pages/RegisterPage'
import VerificationPage from '@features/auth/pages/VerificationPage'

// Feature Pages - Workspace & Dashboard
import DashboardPage from '@features/workspace/pages/DashboardPage'
import ClassroomsPage from '@features/workspace/pages/ClassroomsPage'
import ClassroomDetailPage from '@features/workspace/pages/ClassroomDetailPage'
import JoinClassroomPage from '@features/workspace/pages/JoinClassroomPage'
import ContributionPage from '@features/workspace/pages/ContributionPage'
import AcceptInvitePage from '@features/workspace/pages/AcceptInvitePage'

// Feature Pages - Requirements
import RequirementsPage from '@features/requirement/pages/RequirementsPage'
import RequirementDetailPage from '@features/requirement/pages/RequirementDetailPage'
import AiStagingReviewPage from '@features/requirement/pages/AiStagingReviewPage'

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

// Feature Pages - Code Insight
import TaskReviewDashboardPage from '@features/code-insight/pages/TaskReviewDashboardPage'
import TaskReviewWorkspacePage from '@features/code-insight/pages/TaskReviewWorkspacePage'

// Feature Pages - AI Engine
import SprintReportPage from '@features/sprint-report/pages/SprintReportPage'
import ProfilePage from '@features/profile/pages/ProfilePage'

// Feature Pages - Issue Tracker
import { IssueTrackerDashboard, IssueDetailView, ProjectGithubConfig, GitHubCallbackPage, FeatureDiscussionPage } from '@features/issue-tracker'

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
      <Route path="/classrooms/join" element={<JoinClassroomPage />} />

      {/* 2. Protected Routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          {/* Main Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/classrooms" element={<ClassroomsPage />} />
          <Route path="/classrooms/:classroomId" element={<ClassroomDetailPage />} />
          <Route path="/verify" element={<VerificationPage />} />
          <Route path="/github/callback" element={<GitHubCallbackPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />

          {/* 3. Project Routes (Wrapped in ProjectLayout) */}
          <Route path="/projects/:projectId" element={<ProjectLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Module 1: Requirements Management */}
            <Route path="requirements" element={<RequirementsPage />} />
            <Route path="requirements/staging" element={<AiStagingReviewPage />} />
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

            {/* Module 7: Issue Tracker */}
            <Route path="issues" element={<IssueTrackerDashboard />} />
            <Route path="issues/:bugId" element={<IssueDetailView />} />
            <Route path="bugs" element={<NotFoundPage />} />
            <Route path="bugs/:bugId" element={<IssueDetailView />} />
            <Route path="features/:id/discuss" element={<FeatureDiscussionPage />} />
            <Route path="github-config" element={<ProjectGithubConfig />} />

            {/* Module 8: Traceability Matrix */}
            <Route path="traceability-matrix" element={<RtmPage />} />
            <Route path="task-reviews" element={<TaskReviewDashboardPage />} />
            <Route path="task-reviews/:taskId" element={<TaskReviewWorkspacePage />} />

            {/* Module 9: AI Engine */}
            <Route path="sprint-reports" element={<SprintReportPage />} />
            <Route path="weekly-reports" element={<Navigate to="sprint-reports" replace />} />

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
