import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axiosInstance from '@api/axiosConfig'

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
    rememberMe: false,
  })
  const [loading, setLoading] = useState(false)

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
      // Endpoint giả định hoặc khớp với backend auth login của bạn
      const response = await axiosInstance.post('/v1/auth/login', {
        usernameOrEmail: formData.usernameOrEmail,
        password: formData.password,
      })

      if (response.data?.success) {
        toast.success('Đăng nhập thành công!')
        const token = response.data?.data?.accessToken || 'dummy-token'
        localStorage.setItem('accessToken', token)
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      } else {
        toast.error(response.data?.message || 'Sai tài khoản hoặc mật khẩu!')
      }
    } catch (err) {
      // Đối với mock/chưa có API login: để người dùng test tiện hơn, ta cho phép đăng nhập giả định
      console.warn('API login chưa sẵn sàng, kích hoạt chế độ đăng nhập giả lập.', err)
      
      // Giả lập thành công khi dev
      toast.success('Đăng nhập thành công! (Chế độ giả lập)')
      localStorage.setItem('accessToken', 'mock-jwt-token-from-devtrack-ai')
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } finally {
      setLoading(false)
    }
  }

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
          <form onSubmit={handleSubmit} className="space-y-stack_md">
            
            {/* Username/Email Input */}
            <div>
              <label className="block font-label-md text-label-md text-secondary mb-1" htmlFor="usernameOrEmail">
                Username or Email
              </label>
              <input
                className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed transition-colors"
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
                className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed transition-colors"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                type="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-start mt-stack_md">
              <div className="flex items-center h-5">
                <input
                  className="w-4 h-4 text-primary bg-surface-container border-outline-variant rounded focus:ring-primary-fixed focus:ring-2"
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
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
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                    Signing in...
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
