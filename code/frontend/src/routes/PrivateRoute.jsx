import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '@store/useAuthStore'

function PrivateRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const fetchMe = useAuthStore((state) => state.fetchMe)
  const [checkingSession, setCheckingSession] = useState(isAuthenticated)

  useEffect(() => {
    let mounted = true

    const validateSession = async () => {
      if (!isAuthenticated) {
        setCheckingSession(false)
        return
      }

      await fetchMe()
      if (mounted) setCheckingSession(false)
    }

    validateSession()

    return () => {
      mounted = false
    }
  }, [fetchMe, isAuthenticated])

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-secondary">
        Checking session...
      </div>
    )
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default PrivateRoute
