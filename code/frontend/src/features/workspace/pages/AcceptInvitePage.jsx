import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import useNotificationStore from '@store/useNotificationStore'
import useAuthStore from '@store/useAuthStore'
import useProjectStore from '@store/useProjectStore'

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  
  const { acceptInvitation } = useNotificationStore()
  const { user } = useAuthStore() // Để check xem đã đăng nhập chưa
  const { fetchProjects } = useProjectStore()

  const [status, setStatus] = useState('processing') // 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    // Nếu chưa đăng nhập, chuyển hướng sang login và lưu lại URL hiện tại
    if (!localStorage.getItem('token') && !user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
      return
    }

    if (!token) {
      setStatus('error')
      setErrorMessage('Đường dẫn lời mời không hợp lệ hoặc thiếu mã xác thực.')
      return
    }

    let isMounted = true

    const processInvitation = async () => {
      const result = await acceptInvitation({ token })
      if (!isMounted) return

      if (result === true) {
        setStatus('success')
        // Tải lại danh sách dự án để dự án mới xuất hiện ngay
        fetchProjects()
        
        // Đếm ngược chuyển hướng
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              navigate('/dashboard')
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setStatus('error')
        setErrorMessage(result?.error || 'Có lỗi xảy ra trong quá trình đồng ý tham gia dự án.')
      }
    }

    processInvitation()

    return () => {
      isMounted = false
    }
  }, [token, user, acceptInvitation, fetchProjects, navigate])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] rounded-full bg-primary-fixed opacity-[0.06] blur-[130px]"></div>
        <div className="absolute bottom-[20%] right-[20%] w-[450px] h-[450px] rounded-full bg-secondary-fixed opacity-[0.08] blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-md w-full bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-scale-up">
        {status === 'processing' && (
          <div className="space-y-5 py-6">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-xl text-on-surface">Đang xử lý lời mời</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Vui lòng chờ trong giây lát, hệ thống đang xác nhận quyền tham gia dự án của bạn...
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-5 py-4">
            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
              <span className="material-symbols-outlined text-4xl font-bold">check_circle</span>
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-xl text-on-surface">Đồng ý tham gia thành công!</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Chào mừng bạn đến với dự án. Đang chuyển hướng bạn về Dashboard sau <strong className="text-primary">{countdown}s</strong>...
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-primary text-on-primary font-bold rounded-2xl hover:bg-primary-container hover:text-on-primary-container transition-all shadow-md text-sm mt-4"
            >
              Chuyển hướng ngay
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5 py-4">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-4xl font-bold">error</span>
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-xl text-on-surface text-error">Xác nhận thất bại</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed px-2">
                {errorMessage}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold rounded-2xl transition-all text-sm"
              >
                Về Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-2xl hover:bg-primary-container hover:text-on-primary-container transition-all shadow-md text-sm"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default AcceptInvitePage
