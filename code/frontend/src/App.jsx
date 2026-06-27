import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppRoutes from '@routes/index'
import useAuthStore from '@store/useAuthStore'
import LockOverlay from '@components/feedback/LockOverlay'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  const isLockedOut = useAuthStore((state) => state.isLockedOut)
  const lockReason = useAuthStore((state) => state.lockReason)
  const appealStatus = useAuthStore((state) => state.appealStatus)

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        {isLockedOut && (
          <LockOverlay 
            lockReason={lockReason} 
            isInitiallyPending={appealStatus === 'PENDING'} 
          />
        )}
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
