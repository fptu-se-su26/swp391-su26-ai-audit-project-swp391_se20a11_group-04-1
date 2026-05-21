import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import authService from '../services/authService'
import useAuthStore from '@store/useAuthStore'

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
    rememberMe: false,
  })
  const [loading, setLoading] = useState(false)
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0) // Thời gian khóa còn lại tính bằng giây
  const [lockoutMessage, setLockoutMessage] = useState('')
  const [lockedUsername, setLockedUsername] = useState('') // Tài khoản bị khóa thực tế

  // 1. Phục hồi trạng thái khóa khi load lại trang (F5 Prevention)
  useEffect(() => {
    const savedEndTime = localStorage.getItem('lockoutEndTime')
    const savedMsg = localStorage.getItem('lockoutMessage')
    const savedUser = localStorage.getItem('lockoutUsername')
    if (savedEndTime && savedMsg && savedUser) {
      const timeLeft = Math.floor((parseInt(savedEndTime, 10) - Date.now()) / 1000)
      if (timeLeft > 0) {
        setLockoutTimeLeft(timeLeft)
        setLockoutMessage(savedMsg)
        setLockedUsername(savedUser)
      } else {
        localStorage.removeItem('lockoutEndTime')
        localStorage.removeItem('lockoutMessage')
        localStorage.removeItem('lockoutUsername')
      }
    }
  }, [])

  // 2. Chạy đồng hồ đếm ngược thời gian thực mỗi giây
  useEffect(() => {
    if (lockoutTimeLeft <= 0) {
      localStorage.removeItem('lockoutEndTime')
      localStorage.removeItem('lockoutMessage')
      localStorage.removeItem('lockoutUsername')
      return
    }

    const timer = setInterval(() => {
      setLockoutTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          localStorage.removeItem('lockoutEndTime')
          localStorage.removeItem('lockoutMessage')
          localStorage.removeItem('lockoutUsername')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [lockoutTimeLeft])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.usernameOrEmail || !formData.password) {
      toast.error('Vui lòng nhập tên đăng nhập/email và mật khẩu!')
      return
    }

    setLoading(true)
    try {
      // Gọi API đăng nhập khớp hoàn toàn với Backend REST API
      const response = await authService.login(
        formData.usernameOrEmail,
        formData.password
      )

      if (response.data?.success) {
        toast.success('Đăng nhập thành công!')
        
        // Sử dụng Zustand store để quản lý thông tin phiên đăng nhập
        const { id, systemRole, username, email, fullName } = response.data?.data || {}
        useAuthStore.getState().login(id, systemRole, username, email, fullName)
        
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      } else {
        toast.error(response.data?.message || 'Sai tài khoản hoặc mật khẩu!')
      }
    } catch (err) {
      // Nếu API thật trả về lỗi (như 401, 423, 429), ta hiển thị lỗi chi tiết từ Backend
      if (err.response?.data?.message) {
        const msg = err.response.data.message
        
        // Nếu là lỗi khóa tài khoản (423 Locked)
        if (err.response.status === 423) {
          setLockoutMessage(msg)
          
          // Trích xuất số phút từ câu thông báo lỗi
          const match = msg.match(/(\d+)\s*phút/)
          const minutes = match ? parseInt(match[1], 10) : 5
          const lockoutEndTime = Date.now() + minutes * 60 * 1000
          
          localStorage.setItem('lockoutEndTime', lockoutEndTime.toString())
          localStorage.setItem('lockoutMessage', msg)
          localStorage.setItem('lockoutUsername', formData.usernameOrEmail) // Lưu tài khoản bị khóa
          setLockoutTimeLeft(minutes * 60)
          setLockedUsername(formData.usernameOrEmail)
        } else {
          toast.error(msg)
        }
        return
      }

      // Trường hợp khi đang dev, server chưa bật: hỗ trợ đăng nhập giả lập để test giao diện
      console.warn('API login chưa sẵn sàng hoặc không kết nối được, kích hoạt chế độ giả lập.', err)
      toast.success('Đăng nhập thành công! (Chế độ giả lập)')
      useAuthStore.getState().login('1', 'USER', 'dungsa', 'dungsa@fpt.edu.vn', 'Anh Dung')
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } finally {
      setLoading(false)
    }
  }

  const isCurrentAccountLocked = lockoutTimeLeft > 0 && formData.usernameOrEmail.trim() === lockedUsername.trim()

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex items-center justify-center p-margin_mobile md:p-margin_desktop relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-primary-fixed-dim opacity-20 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-secondary-fixed opacity-30 blur-[120px]"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="p-stack_lg border-b border-surface-container flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-container text-on-primary-container mb-stack_md">
            <span className="material-symbols-outlined text-display-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              dataset
            </span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-stack_sm">Welcome Back</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Sign in to DevTrack AI to manage your projects.</p>
        </div>

        {/* Form Content */}
        <div className="p-stack_lg">
          
          {/* Lockout Warning Banner */}
          {isCurrentAccountLocked && (
            <div className="mb-6 p-4 rounded bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              <p className="font-semibold text-red-400">
                Tài khoản của bạn đang bị khóa tạm thời, vui lòng thử lại sau: {Math.floor(lockoutTimeLeft / 60)} phút {lockoutTimeLeft % 60} giây
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-stack_md">
            
            {/* Username/Email Input */}
            <div>
              <label className="block font-label-md text-label-md text-secondary mb-1" htmlFor="usernameOrEmail">
                Username or Email
              </label>
              <input
                className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed transition-colors disabled:opacity-50"
                id="usernameOrEmail"
                name="usernameOrEmail"
                placeholder="john@example.com"
                required
                type="text"
                value={formData.usernameOrEmail}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-label-md text-label-md text-secondary" htmlFor="password">
                  Password
                </label>
                <a className="font-body-md text-xs text-primary hover:underline" href="#">
                  Forgot Password?
                </a>
              </div>
              <input
                className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed transition-colors disabled:opacity-50"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                type="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading || isCurrentAccountLocked}
              />
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-start mt-stack_md">
              <div className="flex items-center h-5">
                <input
                  className="w-4 h-4 text-primary bg-surface-container border-outline-variant rounded focus:ring-primary-fixed focus:ring-2 disabled:opacity-50"
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading || isCurrentAccountLocked}
                />
              </div>
              <div className="ml-3 font-body-md text-body-md">
                <label className="text-on-surface-variant" htmlFor="rememberMe">
                  Remember me on this device
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-stack_sm">
              <button
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded bg-primary text-on-primary font-body-md text-body-md font-semibold hover:bg-on-primary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors h-[44px] items-center disabled:opacity-50"
                type="submit"
                disabled={loading || isCurrentAccountLocked}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                    Signing in...
                  </span>
                ) : isCurrentAccountLocked ? (
                  <span className="text-red-300">
                    Locked ({Math.floor(lockoutTimeLeft / 60)}m {lockoutTimeLeft % 60}s)
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-stack_lg py-stack_md bg-surface-container-low border-t border-surface-container text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Don't have an account?{' '}
            <Link className="font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors" to="/register">
              Register
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}

export default LoginPage
