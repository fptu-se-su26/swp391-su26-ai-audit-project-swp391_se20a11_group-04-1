import { Navigate, Outlet } from 'react-router-dom'

/**
 * PrivateRoute: Redirect về /login nếu chưa có token
 */
function PrivateRoute() {
  const isAuthenticated = localStorage.getItem('userId')
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default PrivateRoute
