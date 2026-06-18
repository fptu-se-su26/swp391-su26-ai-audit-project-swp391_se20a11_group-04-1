import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import axiosInstance from '@/api/axiosConfig'

export function GitHubCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing') // 'processing', 'success', 'error'
  const called = useRef(false) // Prevent React 18 strict mode double-call

  useEffect(() => {
    const code = searchParams.get('code')
    
    // Extract projectId from state if we passed it, or fallback
    const stateParam = searchParams.get('state')
    let projectId = null
    if (stateParam) {
      try {
        const decoded = JSON.parse(atob(stateParam))
        projectId = decoded.projectId
      } catch (e) {
        console.error("Failed to parse state param", e)
      }
    }

    if (!code) {
      setStatus('error')
      toast.error('GitHub authorization failed: No code provided.')
      setTimeout(() => navigate('/'), 3000)
      return
    }

    if (called.current) return
    called.current = true

    const exchangeCode = async () => {
      try {
        const res = await axiosInstance.post('/v1/github/callback', { code })
        setStatus('success')
        toast.success(res.data?.message || 'GitHub Account Connected!')
        
        // Redirect back to the project config if we know the project, else dashboard
        setTimeout(() => {
          if (projectId) {
            navigate(`/projects/${projectId}/github-config`)
          } else {
            navigate('/') // fallback
          }
        }, 1500)
      } catch (error) {
        setStatus('error')
        toast.error(error.response?.data?.message || 'Failed to link GitHub account.')
      }
    }

    exchangeCode()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center select-none">
      <div className="bg-surface-container-lowest p-10 rounded-3xl shadow-lg border border-outline-variant/50 max-w-md w-full text-center space-y-6">
        
        {status === 'processing' && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
              <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-4xl text-primary">
                sync
              </span>
            </div>
            <h2 className="text-2xl font-black text-on-surface">Connecting to GitHub...</h2>
            <p className="text-on-surface-variant text-sm mt-2">
              Please wait while we securely link your account.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-green-600">
                check_circle
              </span>
            </div>
            <h2 className="text-2xl font-black text-on-surface">Successfully Connected!</h2>
            <p className="text-on-surface-variant text-sm mt-2">
              Redirecting you back to your project...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-red-600">
                error
              </span>
            </div>
            <h2 className="text-2xl font-black text-on-surface">Connection Failed</h2>
            <p className="text-on-surface-variant text-sm mt-2">
              We couldn't link your GitHub account. Please try again.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="mt-6 px-6 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
