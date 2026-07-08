import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import axiosInstance from '@/api/axiosConfig'
import useAuthStore from '@store/useAuthStore'

export function GitHubCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing') // 'processing', 'success', 'error', 'confirm'
  const [githubInfo, setGithubInfo] = useState(null)
  const [registering, setRegistering] = useState(false)
  const called = useRef(false) // Prevent React 18 strict mode double-call

  useEffect(() => {
    const code = searchParams.get('code')
    
    // Extract projectId from state if we passed it, or fallback
    const stateParam = searchParams.get('state')
    let projectId = null
    let isCreateProjectFlow = false
    let isLoginFlow = false
    if (stateParam) {
      try {
        const decoded = JSON.parse(atob(stateParam))
        projectId = decoded.projectId
        isCreateProjectFlow = decoded.isCreateProjectFlow || false
        isLoginFlow = decoded.loginFlow || false
      } catch (e) {
        console.error("Failed to parse state param", e)
      }
    }

    if (!code) {
      setStatus('error')
      toast.error('GitHub authorization failed: No code provided.')
      setTimeout(() => navigate(isLoginFlow ? '/login' : '/'), 3000)
      return
    }

    if (called.current) return
    called.current = true

    const exchangeCode = async () => {
      try {
        if (isLoginFlow) {
          // GitHub login flow
          const res = await axiosInstance.post('/v1/auth/github/login', { code })
          
          if (res.data?.success) {
            setStatus('success')
            toast.success('Logged in successfully with GitHub!')
            
            const { id, systemRole, username, email, fullName, verifyStatus, passwordSet } = res.data?.data || {}
            useAuthStore.getState().login(id, systemRole, username, email, fullName, verifyStatus, passwordSet)
            
            setTimeout(() => {
              if (systemRole === 'ADMIN') {
                navigate('/admin')
              } else {
                navigate('/dashboard')
              }
            }, 1500)
          } else if (res.data?.errorCode === 'USER_NOT_REGISTERED') {
            setStatus('confirm')
            setGithubInfo(res.data?.data)
          } else {
            throw new Error(res.data?.message || 'GitHub login failed.')
          }
        } else {
          // GitHub account linking flow
          const res = await axiosInstance.post('/v1/github/callback', { code })
          setStatus('success')
          toast.success(res.data?.message || 'GitHub Account Connected!')
          
          setTimeout(() => {
            if (isCreateProjectFlow) {
              navigate('/', { state: { openCreateProject: true } })
            } else if (projectId) {
              navigate(`/projects/${projectId}/github-config`)
            } else {
              navigate('/') // fallback
            }
          }, 1500)
        }
      } catch (error) {
        setStatus('error')
        const errMsg = error.response?.data?.message || error.message || 'An error occurred during GitHub authentication.'
        toast.error(errMsg, { duration: 5000 })
        
        // If login fails, redirect back to login page after 3s
        if (isLoginFlow) {
          setTimeout(() => navigate('/login'), 3000)
        } else {
          setTimeout(() => navigate(-1), 3000)
        }
      }
    }

    exchangeCode()
  }, [searchParams, navigate])

  const handleRegister = async () => {
    if (!githubInfo) return
    setRegistering(true)
    const toastId = toast.loading('Initializing account...')
    try {
      const res = await axiosInstance.post('/v1/auth/github/register', {
        email: githubInfo.email,
        username: githubInfo.username,
        avatarUrl: githubInfo.avatarUrl,
        accessToken: githubInfo.accessToken
      })
      if (res.data?.success) {
        toast.success('Account registered successfully!', { id: toastId })
        const { id, systemRole, username, email, fullName, verifyStatus, passwordSet } = res.data?.data || {}
        
        useAuthStore.getState().login(id, systemRole, username, email, fullName, verifyStatus, passwordSet)
        setStatus('success')
        setTimeout(() => {
          if (systemRole === 'ADMIN') {
            navigate('/admin')
          } else {
            navigate('/dashboard')
          }
        }, 1500)
      } else {
        throw new Error(res.data?.message || 'Account registration failed.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed.', { id: toastId })
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center select-none p-4">
      <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-lg border border-outline-variant/50 max-w-md w-full text-center space-y-6">
        
        {status === 'processing' && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-[#1E707D]/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#1E707D] rounded-full border-t-transparent animate-spin"></div>
              <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-4xl text-[#1E707D]">
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

        {status === 'confirm' && githubInfo && (
          <div className="animate-in fade-in zoom-in duration-500 space-y-6">
            <div className="flex justify-center items-center gap-4">
              <span className="material-symbols-outlined text-4xl text-[#1E707D]">
                account_circle
              </span>
              <span className="material-symbols-outlined text-xl text-on-surface-variant animate-pulse">
                arrow_forward
              </span>
              <svg className="w-10 h-10 fill-current text-[#24292e]" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.197 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-black text-on-surface">Create New Account?</h2>
            
            {githubInfo.phone && (
              <img
                src={githubInfo.phone}
                alt={githubInfo.fullName}
                className="w-20 h-20 rounded-full mx-auto border-2 border-[#1E707D] shadow-md object-cover"
              />
            )}

            <p className="text-on-surface-variant text-sm leading-relaxed">
              Hello <strong className="text-on-surface">{githubInfo.username}</strong>! Your account does not exist on DevTrack AI. Do you want to sign up now using this GitHub account?
            </p>

            <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-2 text-left text-xs font-semibold text-on-surface">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Email:</span>
                <span>{githubInfo.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Display Name:</span>
                <span>{githubInfo.username}</span>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => navigate('/login')}
                className="flex-1 px-4 py-2.5 border border-outline-variant hover:bg-surface-container-low text-on-surface font-bold rounded-xl transition-all cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRegister}
                disabled={registering}
                className="flex-1 px-4 py-2.5 bg-[#1E707D] hover:bg-[#154f59] text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer text-sm disabled:opacity-50"
              >
                {registering ? 'Creating...' : 'Register Now'}
              </button>
            </div>
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
              onClick={() => navigate('/login')}
              className="mt-6 px-6 py-2 bg-[#1E707D] text-white font-bold rounded-lg hover:bg-[#1E707D]/90 transition-colors"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default GitHubCallbackPage
