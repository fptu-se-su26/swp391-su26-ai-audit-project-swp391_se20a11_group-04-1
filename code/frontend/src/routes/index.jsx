import { Routes, Route, Navigate } from 'react-router-dom'

// Feature Pages (Imports từ Public APIs)
import { LoginPage, RegisterPage } from '@features/auth'
import { DashboardPage } from '@features/workspace'

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

      {/* 2. Protected Routes (Yêu cầu đăng nhập, sử dụng AppLayout làm khung chung) */}
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Các route của 9 module tính năng khác sẽ được bổ sung tại đây khi phát triển */}
          {/* Ví dụ: <Route path="/requirement" element={<RequirementPage />} /> */}
        </Route>
      </Route>

      {/* 3. Redirect & 404 Pages */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
