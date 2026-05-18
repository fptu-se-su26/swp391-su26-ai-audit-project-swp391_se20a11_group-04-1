import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '@store/useAuthStore'

/**
 * PrivateRoute: Redirect về /login nếu chưa có token đăng nhập
 */
function PrivateRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default PrivateRoute
