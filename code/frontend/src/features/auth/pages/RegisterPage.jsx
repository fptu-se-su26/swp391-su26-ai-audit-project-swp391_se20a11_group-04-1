import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import authService from '../services/authService'
import useFormPersist from '@hooks/useFormPersist'

function RegisterPage() {
  const navigate = useNavigate()
  
  // Registration Form State
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: false,
  })

  // State control
  const [step, setStep] = useState(1) // 1: Registration Form, 2: OTP Verification
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({}) // Frontend & Backend Validation Errors

  // Sử dụng custom hook useFormPersist để tự động lưu nháp dữ liệu form (loại trừ trường mật khẩu nhạy cảm)
  useFormPersist('app-register-draft', {
    data: formData,
    setData: setFormData,
    exclude: ['password', 'confirmPassword'],
    storageType: 'session'
  })

  // Handle Form Inputs Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    
    // Clear validation error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  // Validate form client-side
  const validateForm = () => {
    const tempErrors = {}
    
    if (!formData.fullName.trim()) tempErrors.fullName = 'Họ và tên không được để trống'
    
    if (!formData.username.trim()) {
      tempErrors.username = 'Tên đăng nhập không được để trống'
    } else if (formData.username.length < 3 || formData.username.length > 50) {
      tempErrors.username = 'Tên đăng nhập phải từ 3 đến 50 ký tự'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      tempErrors.username = 'Tên đăng nhập chỉ được chứa chữ cái, chữ số và dấu gạch dưới (_)'
    }

    if (!formData.email.trim()) {
      tempErrors.email = 'Email không được để trống'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Email không hợp lệ'
    }

    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
      tempErrors.phone = 'Số điện thoại phải gồm 10-11 chữ số'
    }

    if (!formData.password) {
      tempErrors.password = 'Mật khẩu không được để trống'
    } else if (formData.password.length < 6) {
      tempErrors.password = 'Mật khẩu phải chứa ít nhất 6 ký tự'
    }

    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'Xác nhận mật khẩu không khớp'
    }

    if (!formData.terms) {
      tempErrors.terms = 'Bạn phải đồng ý với Điều khoản dịch vụ và Chính sách bảo mật'
    }

    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  // Handle Request Registration (Step 1)
  const handleRegisterRequest = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin nhập liệu!')
      return
    }

    setLoading(true)
    setErrors({})

    const requestPayload = {
      fullName: formData.fullName,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      phone: formData.phone || null,
    }

    try {
      const response = await authService.registerRequest(requestPayload)
      
      if (response.data?.success) {
        toast.success(response.data.message || 'Mã OTP đã được gửi đến email của bạn!')
        setStep(2) // Move to OTP verification step
      } else {
        toast.error(response.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!')
      }
    } catch (err) {
      const errorData = err.response?.data
      const status = err.response?.status
      
      if (errorData) {
        if (errorData.errors && typeof errorData.errors === 'object') {
          // Validation errors from Spring Boot (e.g. FieldName -> ErrorMessage)
          setErrors(errorData.errors)
          toast.error('Dữ liệu không hợp lệ. Vui lòng kiểm tra các ô màu đỏ!')
        } else if (status === 500) {
          // Server internal error - likely Redis/Email/DB configuration issue
          toast.error('Hệ thống đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ quản trị viên!')
        } else {
          // Business error (e.g. email or username already exists)
          toast.error(errorData.message || 'Có lỗi xảy ra!')
        }
      } else {
        toast.error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau!')
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP Verification (Step 2)
  const handleOtpVerify = async (e) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      toast.error('Vui lòng nhập chính xác mã OTP gồm 6 chữ số!')
      return
    }

    setLoading(true)
    
    try {
      const response = await authService.registerVerify(formData.email, otp)

      if (response.data?.success) {
        toast.success('Đăng ký tài khoản thành công!')
        sessionStorage.removeItem('app-register-draft')
        // Chờ 1.5 giây để người dùng thấy thông báo thành công rồi chuyển hướng sang Login
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      } else {
        toast.error(response.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn!')
      }
    } catch (err) {
      const errorData = err.response?.data
      toast.error(errorData?.message || 'Mã OTP không chính xác hoặc đã hết hạn!')
    } finally {
      setLoading(false)
    }
  }

  // Handle Resend OTP Code
  const handleResendOtp = async () => {
    setLoading(true)
    try {
      const requestPayload = {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || null,
      }
      const response = await authService.registerRequest(requestPayload)
      if (response.data?.success) {
        toast.success('Mã OTP mới đã được gửi lại vào email của bạn!')
      } else {
        toast.error(response.data?.message || 'Gửi lại mã OTP thất bại!')
      }
    } catch (err) {
      const errorData = err.response?.data
      toast.error(errorData?.message || 'Không thể gửi lại mã OTP!')
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

      {/* Registration Card */}
      <div className="relative z-10 w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <div className="p-stack_lg border-b border-surface-container flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-container text-on-primary-container mb-stack_md">
            <span className="material-symbols-outlined text-display-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              dataset
            </span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-stack_sm">
            {step === 1 ? 'Create an Account' : 'Xác thực Email'}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {step === 1 
              ? 'Join DevTrack AI to manage your projects.' 
              : `Mã OTP đã được gửi tới email ${formData.email}`}
          </p>
        </div>

        {/* STEP 1: Registration Form */}
        {step === 1 && (
          <div className="p-stack_lg">
            <form onSubmit={handleRegisterRequest} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block font-label-md text-label-md text-secondary mb-1" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  className={`w-full px-3 py-2 border rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 transition-colors ${
                    errors.fullName 
                      ? 'border-error focus:border-error focus:ring-error-container' 
                      : 'border-outline-variant focus:border-primary focus:ring-primary-fixed'
                  }`}
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.fullName && (
                  <p className="text-error text-xs mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="block font-label-md text-label-md text-secondary mb-1" htmlFor="username">
                  Username
                </label>
                <input
                  className={`w-full px-3 py-2 border rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 transition-colors ${
                    errors.username 
                      ? 'border-error focus:border-error focus:ring-error-container' 
                      : 'border-outline-variant focus:border-primary focus:ring-primary-fixed'
                  }`}
                  id="username"
                  name="username"
                  placeholder="johndoe_99"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.username && (
                  <p className="text-error text-xs mt-1">{errors.username}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block font-label-md text-label-md text-secondary mb-1" htmlFor="email">
                  Email Address
                </label>
                <input
                  className={`w-full px-3 py-2 border rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 transition-colors ${
                    errors.email 
                      ? 'border-error focus:border-error focus:ring-error-container' 
                      : 'border-outline-variant focus:border-primary focus:ring-primary-fixed'
                  }`}
                  id="email"
                  name="email"
                  placeholder="john@example.com"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-error text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone Number (Optional) */}
              <div>
                <label className="block font-label-md text-label-md text-secondary mb-1" htmlFor="phone">
                  Phone Number <span className="text-on-surface-variant opacity-60 font-normal">(Optional)</span>
                </label>
                <input
                  className={`w-full px-3 py-2 border rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 transition-colors ${
                    errors.phone 
                      ? 'border-error focus:border-error focus:ring-error-container' 
                      : 'border-outline-variant focus:border-primary focus:ring-primary-fixed'
                  }`}
                  id="phone"
                  name="phone"
                  placeholder="0912345678"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.phone && (
                  <p className="text-error text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block font-label-md text-label-md text-secondary mb-1" htmlFor="password">
                  Password
                </label>
                <input
                  className={`w-full px-3 py-2 border rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 transition-colors ${
                    errors.password 
                      ? 'border-error focus:border-error focus:ring-error-container' 
                      : 'border-outline-variant focus:border-primary focus:ring-primary-fixed'
                  }`}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.password && (
                  <p className="text-error text-xs mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block font-label-md text-label-md text-secondary mb-1" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  className={`w-full px-3 py-2 border rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 transition-colors ${
                    errors.confirmPassword 
                      ? 'border-error focus:border-error focus:ring-error-container' 
                      : 'border-outline-variant focus:border-primary focus:ring-primary-fixed'
                  }`}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.confirmPassword && (
                  <p className="text-error text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start mt-2">
                <div className="flex items-center h-5">
                  <input
                    className={`w-4 h-4 text-primary bg-surface-container border rounded focus:ring-primary-fixed focus:ring-2 ${
                      errors.terms ? 'border-error focus:ring-error' : 'border-outline-variant'
                    }`}
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={formData.terms}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                <div className="ml-3 font-body-md text-body-md">
                  <label className="text-on-surface-variant" htmlFor="terms">
                    I agree to the <a className="text-primary hover:underline" href="#">Terms of Service</a> and <a className="text-primary hover:underline" href="#">Privacy Policy</a>.
                  </label>
                  {errors.terms && (
                    <p className="text-error text-xs mt-1">{errors.terms}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded bg-primary text-on-primary font-body-md text-body-md font-semibold hover:bg-on-primary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors h-[44px] items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                      Registering...
                    </span>
                  ) : (
                    'Register'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: OTP Verification Form */}
        {step === 2 && (
          <div className="p-stack_lg">
            <form onSubmit={handleOtpVerify} className="space-y-6">
              <div>
                <label className="block font-label-md text-label-md text-secondary mb-2 text-center" htmlFor="otp">
                  Nhập mã xác thực (OTP)
                </label>
                <input
                  className="w-full px-4 py-3 border border-outline-variant rounded bg-surface-container-lowest font-label-md text-2xl tracking-[0.75em] text-center text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed transition-all"
                  id="otp"
                  maxLength={6}
                  name="otp"
                  placeholder="000000"
                  required
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  disabled={loading}
                />
                <p className="text-xs text-on-surface-variant mt-2 text-center">
                  Vui lòng nhập đúng 6 chữ số được gửi trong email của bạn.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded bg-primary text-on-primary font-body-md text-body-md font-semibold hover:bg-on-primary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors h-[44px] items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                      Verifying...
                    </span>
                  ) : (
                    'Xác nhận & Hoàn tất'
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    className="text-primary hover:underline font-semibold disabled:opacity-50"
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                  >
                    Gửi lại mã OTP
                  </button>
                  <button
                    className="text-secondary hover:underline font-semibold"
                    type="button"
                    onClick={() => {
                      setStep(1)
                      setErrors({})
                    }}
                    disabled={loading}
                  >
                    Quay lại sửa thông tin
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="px-stack_lg py-stack_md bg-surface-container-low border-t border-surface-container text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Already have an account?{' '}
            <Link className="font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors" to="/login">
              Login
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}

export default RegisterPage
