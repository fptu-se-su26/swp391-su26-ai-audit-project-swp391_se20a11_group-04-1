import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import authService from '../services/authService'

function ForgotPasswordPage() {
  const navigate = useNavigate()

  // State control
  const [step, setStep] = useState(1) // 1: Email Request, 2: OTP & Reset Password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [timeLeft, setTimeLeft] = useState(0) // Countdown timer in seconds
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Validate Step 1 Form
  const validateStep1 = () => {
    const tempErrors = {}
    if (!email.trim()) {
      tempErrors.email = 'Email không được để trống'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Email không hợp lệ'
    }
    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  // Validate Step 2 Form
  const validateStep2 = () => {
    const tempErrors = {}
    if (!otp || otp.length !== 6) {
      tempErrors.otp = 'Mã OTP phải chứa đúng 6 chữ số'
    }
    if (!newPassword) {
      tempErrors.newPassword = 'Mật khẩu mới không được để trống'
    } else if (newPassword.length < 6) {
      tempErrors.newPassword = 'Mật khẩu phải chứa ít nhất 6 ký tự'
    }
    if (newPassword !== confirmPassword) {
      tempErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }
    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  // Handle Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault()
    if (!validateStep1()) return

    setLoading(true)
    setErrors({})

    try {
      const response = await authService.forgotPasswordRequest(email)
      if (response.data?.success) {
        toast.success(response.data.message || 'Mã OTP đã được gửi về email của bạn!')
        setStep(2)
        setTimeLeft(60) // Start 60s countdown
      } else {
        toast.error(response.data?.message || 'Không thể gửi mã OTP, vui lòng thử lại!')
      }
    } catch (err) {
      const errorData = err.response?.data
      toast.error(errorData?.message || 'Email không tồn tại trong hệ thống hoặc lỗi máy chủ.')
      if (errorData?.errors && typeof errorData.errors === 'object') {
        setErrors(errorData.errors)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (timeLeft > 0) return
    await handleRequestOtp()
  }

  // Handle Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!validateStep2()) return

    setLoading(true)
    setErrors({})

    const payload = {
      email,
      otp,
      newPassword,
    }

    try {
      const response = await authService.forgotPasswordReset(payload)
      if (response.data?.success) {
        toast.success('Mật khẩu của bạn đã được đặt lại thành công!')
        // Chờ 1.5 giây để người dùng đọc thông tin trước khi chuyển về Login
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      } else {
        toast.error(response.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!')
      }
    } catch (err) {
      const errorData = err.response?.data
      toast.error(errorData?.message || 'Mã OTP không chính xác hoặc đã hết hạn!')
      if (errorData?.errors && typeof errorData.errors === 'object') {
        setErrors(errorData.errors)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex items-center justify-center p-margin_mobile md:p-margin_desktop relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-[#BFDEEA] opacity-20 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-secondary-fixed opacity-30 blur-[120px]"></div>
      </div>

      {/* Card Form */}
      <div className="relative z-10 w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <div className="p-stack_lg border-b border-surface-container flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#D7EEF1] text-[#1E707D] mb-stack_md">
            <span className="material-symbols-outlined text-display-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              lock_reset
            </span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-stack_sm">
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant px-2">
            {step === 1 
              ? 'Nhập địa chỉ email của bạn để nhận mã OTP khôi phục mật khẩu.' 
              : `Mã OTP khôi phục mật khẩu đã được gửi đến email ${email}`}
          </p>
        </div>

        {/* STEP 1: Email Request Form */}
        {step === 1 && (
          <div className="p-stack_lg">
            <form onSubmit={handleRequestOtp} className="space-y-6">
              
              {/* Email Address */}
              <div>
                <label className="block font-label-md text-label-md text-secondary mb-1" htmlFor="email">
                  Email Address
                </label>
                <input
                  className={`w-full px-3 py-2 border rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 transition-colors ${
                    errors.email 
                      ? 'border-error focus:border-error focus:ring-error-container' 
                      : 'border-outline-variant focus:border-[#1E707D] focus:ring-primary-fixed'
                  }`}
                  id="email"
                  name="email"
                  placeholder="john@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }))
                  }}
                  disabled={loading}
                  required
                />
                {errors.email && (
                  <p className="text-error text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded bg-[#1E707D] text-white font-body-md text-body-md font-semibold hover:bg-[#165964] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E707D] transition-colors h-[44px] items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                      Sending OTP...
                    </span>
                  ) : (
                    'Gửi mã OTP'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: OTP Verification & Reset Password Form */}
        {step === 2 && (
          <div className="p-stack_lg">
            <form onSubmit={handleResetPassword} className="space-y-4">
              
              {/* OTP */}
              <div>
                <label className="block font-label-md text-label-md text-secondary mb-2 text-center" htmlFor="otp">
                  Nhập mã xác thực (OTP)
                </label>
                <input
                  className={`w-full px-4 py-2 border rounded bg-surface-container-lowest font-label-md text-2xl tracking-[0.75em] text-center text-on-surface focus:outline-none focus:ring-2 transition-all ${
                    errors.otp 
                      ? 'border-error focus:border-error focus:ring-error-container' 
                      : 'border-outline-variant focus:border-[#1E707D] focus:ring-primary-fixed'
                  }`}
                  id="otp"
                  maxLength={6}
                  name="otp"
                  placeholder="000000"
                  required
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/[^0-9]/g, ''))
                    if (errors.otp) setErrors((prev) => ({ ...prev, otp: null }))
                  }}
                  disabled={loading}
                />
                {errors.otp && (
                  <p className="text-error text-xs mt-1 text-center">{errors.otp}</p>
                )}
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label className="block font-label-md text-label-md text-secondary mb-1" htmlFor="newPassword">
                  Mật khẩu mới
                </label>
                <input
                  className={`w-full px-3 py-2 border rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 transition-colors ${
                    errors.newPassword 
                      ? 'border-error focus:border-error focus:ring-error-container' 
                      : 'border-outline-variant focus:border-[#1E707D] focus:ring-primary-fixed'
                  }`}
                  id="newPassword"
                  name="newPassword"
                  placeholder="••••••••"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: null }))
                  }}
                  disabled={loading}
                  required
                />
                {errors.newPassword && (
                  <p className="text-error text-xs mt-1">{errors.newPassword}</p>
                )}
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label className="block font-label-md text-label-md text-secondary mb-1" htmlFor="confirmPassword">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  className={`w-full px-3 py-2 border rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 transition-colors ${
                    errors.confirmPassword 
                      ? 'border-error focus:border-error focus:ring-error-container' 
                      : 'border-outline-variant focus:border-[#1E707D] focus:ring-primary-fixed'
                  }`}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }))
                  }}
                  disabled={loading}
                  required
                />
                {errors.confirmPassword && (
                  <p className="text-error text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit & Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded bg-[#1E707D] text-white font-body-md text-body-md font-semibold hover:bg-[#165964] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E707D] transition-colors h-[44px] items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                      Resetting Password...
                    </span>
                  ) : (
                    'Xác nhận & Đặt lại mật khẩu'
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    className="text-[#1E707D] hover:underline font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading || timeLeft > 0}
                  >
                    {timeLeft > 0 ? `Gửi lại sau (${timeLeft}s)` : 'Gửi lại mã OTP'}
                  </button>
                  <button
                    className="text-secondary hover:underline font-semibold"
                    type="button"
                    onClick={() => {
                      setStep(1)
                      setErrors({})
                      setOtp('')
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                    disabled={loading}
                  >
                    Sửa lại địa chỉ email
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="px-stack_lg py-stack_md bg-surface-container-low border-t border-surface-container text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Quay lại{' '}
            <Link className="font-semibold text-[#1E707D] hover:text-[#165964] transition-colors" to="/login">
              Đăng nhập
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}

export default ForgotPasswordPage
