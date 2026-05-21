import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Feature Pages
import LoginPage from '@features/auth/pages/LoginPage'
import RegisterPage from '@features/auth/pages/RegisterPage'
import DashboardPage from '@features/workspace/pages/DashboardPage'
import RequirementsPage from '@features/requirement/pages/RequirementsPage'
import RequirementDetailPage from '@features/requirement/pages/RequirementDetailPage'

// Layouts
import MainLayout from '@components/layout/MainLayout'

// Shared Feedback Components
import NotFoundPage from '@components/feedback/NotFoundPage'

// Route Guards
import PrivateRoute from '@routes/PrivateRoute'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        {/*<Route element={<PrivateRoute />}>*/}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route element={<MainLayout />}>
            <Route path="/requirements" element={<RequirementsPage />} />
            <Route path="/requirements/:id" element={<RequirementDetailPage />} />
          </Route>
        {/*</Route>*/}

        {/* Redirect & 404 */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
