import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import authService from '../services/authService'
import useOtpTimer from '@hooks/useOtpTimer'

function ForgotPasswordPage() {
  const navigate = useNavigate()

  // State control
  const [step, setStep] = useState(1) // 1: Email Request, 2: OTP Verification, 3: New Password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Sử dụng custom hook useOtpTimer để quản lý bộ đếm ngược và hạn chế spam
  const {
    timeLeft,
    otpExpiryTime,
    isSpamBlocked,
    startCooldown,
    startExpiry,
    setSpamBlocked,
    formatTime,
  } = useOtpTimer()

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

  // Validate Step 2 Form (OTP)
  const validateStep2 = () => {
    const tempErrors = {}
    if (!otp || otp.length !== 6) {
      tempErrors.otp = 'Mã OTP phải chứa đúng 6 chữ số'
    } else if (otpExpiryTime <= 0) {
      tempErrors.otp = 'Mã OTP đã hết hạn, vui lòng gửi lại mã mới'
    }
    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  // Validate Step 3 Form (New Password)
  const validateStep3 = () => {
    const tempErrors = {}
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
        startCooldown(60) // Start 60s resend cooldown
        startExpiry(300) // Start 5m (300s) OTP expiry countdown
        setOtp('') // Clear previous OTP
        setSpamBlocked(false) // Ensure blocked state is cleared on success
      } else {
        toast.error(response.data?.message || 'Không thể gửi mã OTP, vui lòng thử lại!')
      }
    } catch (err) {
      const errorData = err.response?.data
      toast.error(errorData?.message || 'Email không tồn tại trong hệ thống hoặc lỗi máy chủ.')
      if (errorData?.message && errorData.message.includes("vượt quá giới hạn")) {
        setSpamBlocked(true)
      }
      if (errorData?.errors && typeof errorData.errors === 'object') {
        setErrors(errorData.errors)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (timeLeft > 0 || isSpamBlocked) return
    await handleRequestOtp()
  }

  // Handle Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!validateStep2()) return

    setLoading(true)
    setErrors({})

    try {
      const response = await authService.forgotPasswordVerifyOtp(email, otp)
      if (response.data?.success) {
        toast.success('Mã OTP chính xác!')
        setResetToken(response.data.data.resetToken)
        setStep(3) // Transition to Step 3
      } else {
        toast.error(response.data?.message || 'Mã OTP không hợp lệ!')
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

  // Handle Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!validateStep3()) return

    setLoading(true)
    setErrors({})

    const payload = {
      email,
      resetToken,
      newPassword,
    }

    try {
      const response = await authService.forgotPasswordReset(payload)
      if (response.data?.success) {
        toast.success('Mật khẩu của bạn đã được đặt lại thành công!')
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      } else {
        toast.error(response.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!')
      }
    } catch (err) {
      const errorData = err.response?.data
      toast.error(errorData?.message || 'Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!')
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
            {step === 1 ? 'Forgot Password' : step === 2 ? 'Verify OTP' : 'Reset Password'}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant px-2">
            {step === 1 
              ? 'Nhập địa chỉ email của bạn để nhận mã OTP khôi phục mật khẩu.' 
              : step === 2
              ? `Mã OTP khôi phục mật khẩu đã được gửi đến email ${email}`
              : 'Đặt mật khẩu mới cho tài khoản của bạn.'}
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
                    setSpamBlocked(false)
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }))
                  }}
                  disabled={loading}
                  required
                />
                {errors.email && (
                  <p className="text-error text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {isSpamBlocked && (
                <p className="text-error text-xs text-center font-semibold bg-error-container/10 p-2.5 rounded border border-error/20">
                  ⚠️ Bạn đã vượt quá giới hạn 3 yêu cầu OTP trong ngày. Vui lòng quay lại sau 24 giờ.
                </p>
              )}

              {/* Submit Button */}
              <div>
                <button
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded bg-[#1E707D] text-white font-body-md text-body-md font-semibold hover:bg-[#165964] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E707D] transition-colors h-[44px] items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading || isSpamBlocked}
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

        {/* STEP 2: OTP Verification Form */}
        {step === 2 && (
          <div className="p-stack_lg">
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              
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
                  disabled={loading || otpExpiryTime <= 0}
                />
                
                {otpExpiryTime > 0 ? (
                  <p className="text-xs font-semibold text-center mt-3 text-secondary">
                    Mã OTP sẽ hết hạn sau: <span className="text-[#1E707D] font-bold text-sm font-mono">{formatTime(otpExpiryTime)}</span>
                  </p>
                ) : (
                  <p className="text-xs font-bold text-center mt-3 text-error">
                    ⚠️ Mã OTP đã hết hạn. Vui lòng nhấn gửi lại mã mới.
                  </p>
                )}

                {isSpamBlocked && (
                  <p className="text-error text-xs text-center font-semibold mt-3 bg-error-container/10 p-2.5 rounded border border-error/20">
                    ⚠️ Bạn đã vượt quá giới hạn 3 yêu cầu OTP trong ngày. Vui lòng quay lại sau 24 giờ.
                  </p>
                )}

                {errors.otp && (
                  <p className="text-error text-xs mt-1 text-center">{errors.otp}</p>
                )}
              </div>

              {/* Submit & Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded bg-[#1E707D] text-white font-body-md text-body-md font-semibold hover:bg-[#165964] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E707D] transition-colors h-[44px] items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading || otpExpiryTime <= 0}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                      Verifying OTP...
                    </span>
                  ) : (
                    'Xác nhận mã OTP'
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    className="text-[#1E707D] hover:underline font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading || timeLeft > 0 || isSpamBlocked}
                  >
                    {isSpamBlocked ? 'Đã bị khóa gửi lại' : timeLeft > 0 ? `Gửi lại sau (${timeLeft}s)` : 'Gửi lại mã OTP'}
                  </button>
                  <button
                    className="text-secondary hover:underline font-semibold"
                    type="button"
                    onClick={() => {
                      setStep(1)
                      setErrors({})
                      setOtp('')
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

        {/* STEP 3: Reset Password Form */}
        {step === 3 && (
          <div className="p-stack_lg">
            <form onSubmit={handleResetPassword} className="space-y-4">
              
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

              {/* Submit Button */}
              <div className="pt-2">
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
                    'Đặt lại mật khẩu'
                  )}
                </button>
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
