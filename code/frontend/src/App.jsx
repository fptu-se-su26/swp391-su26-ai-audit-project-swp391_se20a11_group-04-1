import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Feature Pages
import LoginPage from '@features/auth/pages/LoginPage'
import RegisterPage from '@features/auth/pages/RegisterPage'
import DashboardPage from '@features/workspace/pages/DashboardPage'
import UseCasePage from '@features/requirement/pages/UseCasePage'
import UseCaseDetailPage from '@features/requirement/pages/UseCaseDetailPage'

// Shared Feedback Components
import NotFoundPage from '@components/feedback/NotFoundPage'

// Route Guards
import PrivateRoute from '@routes/PrivateRoute'
import AppLayout from '@components/layout/AppLayout'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/use-cases" element={<UseCasePage />} />
            <Route path="/use-cases/:id" element={<UseCaseDetailPage />} />
          </Route>
        </Route>

        {/* Redirect & 404 */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
