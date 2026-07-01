import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import authService from '../services/authService'
import useAuthStore from '@store/useAuthStore'
import axiosInstance from '@api/axiosConfig'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const returnUrl = location.state?.returnUrl || '/dashboard'
  
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
    rememberMe: false,
  })
  const [loading, setLoading] = useState(false)
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0) // Thời gian khóa còn lại tính bằng giây
  const [lockoutMessage, setLockoutMessage] = useState('')
  const [lockedUsername, setLockedUsername] = useState('') // Tài khoản bị khóa thực tế
  const [permanentBanMessage, setPermanentBanMessage] = useState('') // Lý do bị ban vĩnh viễn
  
  // Các state phục vụ cho form kháng cáo trực tiếp tại trang login
  const [showAppealForm, setShowAppealForm] = useState(false)
  const [appealUser, setAppealUser] = useState('')
  const [appealText, setAppealText] = useState('')
  const [appealLoading, setAppealLoading] = useState(false)
  const [appealSubmitted, setAppealSubmitted] = useState(false)

  // State phục vụ upload tài liệu minh chứng
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [evidenceUrl, setEvidenceUrl] = useState('')

  // Tải tài liệu minh chứng lên Cloudinary thông qua backend
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)
    setUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axiosInstance.post('/v1/auth/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
        },
      })

      if (response.data && response.data.success) {
        setEvidenceUrl(response.data.data)
        toast.success('Tải lên tài liệu minh chứng thành công!')
      }
    } catch (err) {
      console.error('Failed to upload file:', err)
      toast.error(err.response?.data?.message || 'Tải lên tài liệu minh chứng thất bại.')
      setFileName('')
      setEvidenceUrl('')
    } finally {
      setUploading(false)
    }
  }

  // Đồng bộ tên đăng nhập từ form đăng nhập sang form kháng cáo để tối ưu trải nghiệm người dùng
  useEffect(() => {
    if (formData.usernameOrEmail) {
      setAppealUser(formData.usernameOrEmail)
    }
  }, [formData.usernameOrEmail])

  // Xử lý query parameters khi bị redirect từ WebSocket lúc đang thao tác
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('locked') === 'true') {
      const reason = params.get('reason') || 'Vi phạm chính sách bảo mật hệ thống.'
      setPermanentBanMessage(reason)
      // Dọn sạch URL mà không cần tải lại trang
      navigate('/login', { replace: true })
    }
  }, [location, navigate])

  const handleAppealSubmit = async (e) => {
    e.preventDefault()
    if (!appealUser.trim() || !appealText.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin!')
      return
    }

    setAppealLoading(true)
    try {
      const response = await authService.submitAppeal(
        null, // Không truyền userId vì chưa đăng nhập
        appealUser.trim(),
        appealText.trim(),
        evidenceUrl || null,
        fileName || null
      )

      if (response.data?.success) {
        toast.success('Gửi đơn kháng cáo thành công!')
        setAppealSubmitted(true)
        setAppealText('')
        setFileName('')
        setEvidenceUrl('')
      }
    } catch (err) {
      console.error('Failed to submit appeal:', err)
      toast.error(err.response?.data?.message || 'Gửi đơn kháng cáo thất bại.')
    } finally {
      setAppealLoading(false)
    }
  }

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
    // Clear permanent ban message when typing a new username/email
    if (name === 'usernameOrEmail') {
      setPermanentBanMessage('')
    }
  }

  const handleGitHubLogin = async () => {
    try {
      const response = await authService.getGitHubLoginUrl()
      if (response.data?.success && response.data?.data) {
        window.location.href = response.data.data
      } else {
        toast.error('Không lấy được link đăng nhập GitHub!')
      }
    } catch (err) {
      console.error('Failed to get GitHub login URL:', err)
      toast.error('Lỗi khi kết nối đến GitHub: ' + (err.response?.data?.message || err.message))
    }
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
          if (systemRole === 'ADMIN') {
            navigate('/admin')
          } else {
            navigate(returnUrl)
          }
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
          const isPermanentBan = msg.includes("admin khóa") || !msg.includes("tạm thời");
          
          if (isPermanentBan) {
            setPermanentBanMessage(msg);
            toast.error(msg, { duration: 5000 });
          } else {
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
          }
        } else {
          toast.error(msg)
        }
        return;
      }

      // Trường hợp khi đang dev, server chưa bật: hỗ trợ đăng nhập giả lập để test giao diện
      console.warn('API login chưa sẵn sàng hoặc không kết nối được, kích hoạt chế độ giả lập.', err)
      toast.success('Đăng nhập thành công! (Chế độ giả lập)')
      useAuthStore.getState().login('1', 'USER', 'dungsa', 'dungsa@fpt.edu.vn', 'Anh Dung')
      setTimeout(() => {
        navigate(returnUrl)
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
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-[#BFDEEA] opacity-20 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-secondary-fixed opacity-30 blur-[120px]"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="p-stack_lg border-b border-surface-container flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#D7EEF1] text-[#1E707D] mb-stack_md">
            <span className="material-symbols-outlined text-display-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              dataset
            </span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-stack_sm">Welcome Back</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Sign in to DevTrack AI to manage your projects.</p>
        </div>

        {/* Form Content */}
        <div className="p-stack_lg">
          
          {/* Permanent Ban Warning Banner with high-fidelity styling and Appeal form */}
          {permanentBanMessage && (
            <div className="mb-6 p-5 rounded-2xl bg-red-50 border border-red-200 shadow-sm text-left animate-in fade-in zoom-in-95 duration-300">
              <div className="mb-3">
                <h3 className="font-bold text-red-900 text-sm">Tài khoản đã bị khóa</h3>
                <p className="text-[10px] text-red-700 font-bold uppercase tracking-wider">Hệ thống</p>
              </div>
              
              <div className="p-3 bg-white/95 rounded-xl border border-red-100 mb-3">
                <p className="text-[10px] text-red-850 font-bold uppercase tracking-wider mb-1">Lý do khóa tài khoản:</p>
                <p className="text-xs text-red-900 leading-relaxed italic font-medium">"{permanentBanMessage}"</p>
              </div>

              {!showAppealForm ? (
                <div className="text-xs text-slate-600 leading-relaxed">
                  {permanentBanMessage.includes("đang được xử lý") ? (
                    <span className="text-amber-700 font-bold flex items-center gap-1.5 mt-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                      Đơn kháng cáo của bạn đang được Ban quản trị xem xét.
                    </span>
                  ) : (
                    <>
                      Nếu đây là sự nhầm lẫn hoặc bạn muốn giải trình, vui lòng{' '}
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowAppealForm(true)
                          setAppealSubmitted(false)
                        }} 
                        className="text-[#1E707D] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer text-xs focus:outline-none"
                      >
                        gửi kháng cáo tại đây
                      </button>
                      .
                    </>
                  )}
                </div>
              ) : appealSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2 animate-in fade-in duration-300">
                  <span className="material-symbols-outlined text-2xl text-emerald-600">check_circle</span>
                  <p className="text-xs font-bold text-emerald-950">Gửi đơn kháng cáo thành công!</p>
                  <p className="text-[11px] text-emerald-850 leading-relaxed">
                    Đơn giải trình đã được gửi tới Ban quản trị. Chúng tôi sẽ xem xét và phản hồi sớm nhất qua email.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAppealForm(false)
                      setAppealSubmitted(false)
                      setFileName('')
                      setEvidenceUrl('')
                    }}
                    className="text-xs font-bold text-[#1E707D] hover:underline bg-transparent border-none p-0 cursor-pointer mt-1"
                  >
                    Quay lại đăng nhập
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAppealSubmit} className="mt-4 pt-4 border-t border-red-150 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#1E707D]">edit_document</span>
                    Gửi đơn giải trình & kháng cáo
                  </h4>
                  
                  {/* Account Identifier (Username or Email) */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Tên đăng nhập hoặc Email
                    </label>
                    <input
                      type="text"
                      required
                      value={appealUser}
                      onChange={(e) => setAppealUser(e.target.value)}
                      placeholder="Nhập tên đăng nhập hoặc email cần kháng cáo"
                      className="w-full px-3 py-2 border border-slate-200 rounded bg-white font-body-md text-xs text-on-surface focus:outline-none focus:border-[#1E707D] focus:ring-2 focus:ring-primary-fixed transition-colors"
                    />
                  </div>

                  {/* Appeal Reason */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Nội dung giải trình
                    </label>
                    <textarea
                      required
                      value={appealText}
                      onChange={(e) => setAppealText(e.target.value)}
                      placeholder="Nhập lý do chi tiết hoặc bằng chứng đối chứng để Admin xem xét..."
                      className="w-full p-2.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-[#1E707D] transition-colors h-20 resize-none"
                    />
                  </div>

                  {/* Simulated File Upload Area */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Tài liệu minh chứng đính kèm (Tùy chọn)
                    </label>
                    <div className="relative border border-dashed border-slate-300 hover:border-[#1E707D] rounded-lg p-3 transition-colors bg-slate-50/50">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.zip"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={uploading}
                      />
                      
                      {fileName ? (
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-1 text-slate-700 font-bold truncate">
                            <span className="material-symbols-outlined text-[#1E707D] text-base">description</span>
                            <span className="truncate">{fileName}</span>
                          </div>
                          {uploading ? (
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">Đang tải... {uploadProgress}%</span>
                          ) : (
                            <span className="text-[10px] text-green-600 shrink-0 font-bold flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-xs">check_circle</span> Đã đính kèm
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-0.5 text-slate-400 text-center">
                          <span className="material-symbols-outlined text-2xl">upload_file</span>
                          <span className="text-[10px] font-bold text-slate-600">Chọn file hoặc kéo thả vào đây</span>
                          <span className="text-[8px] text-slate-400">PDF, PNG, JPG, ZIP (Tối đa 10MB)</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    {uploading && (
                      <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="bg-[#1E707D] h-full rounded-full transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>

                  {/* Submit and Cancel buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAppealForm(false)
                        setAppealSubmitted(false)
                        setFileName('')
                        setEvidenceUrl('')
                      }}
                      className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold rounded text-xs hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={appealLoading || uploading}
                      className="flex-1 py-2 bg-[#1E707D] hover:bg-[#154f59] text-white font-bold rounded text-xs transition-colors shadow-sm flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 focus:outline-none"
                    >
                      {appealLoading ? 'Đang gửi...' : 'Gửi đơn'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Lockout Warning Banner */}
          {isCurrentAccountLocked && (
            <div className="mb-6 p-4 rounded bg-red-500/10 border border-red-500/20 text-red-800 text-sm font-medium">
              <p className="font-semibold text-red-750 text-center">
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
                className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:border-[#1E707D] focus:ring-2 focus:ring-primary-fixed transition-colors disabled:opacity-50"
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
                <a className="font-body-md text-xs text-[#1E707D] hover:underline" href="#">
                  Forgot Password?
                </a>
              </div>
              <input
                className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:border-[#1E707D] focus:ring-2 focus:ring-primary-fixed transition-colors disabled:opacity-50"
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
                  className="w-4 h-4 text-[#1E707D] bg-surface-container border-outline-variant rounded focus:ring-primary-fixed focus:ring-2 disabled:opacity-50"
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
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded bg-[#1E707D] text-white font-body-md text-body-md font-semibold hover:bg-[#165964] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E707D] transition-colors h-[44px] items-center disabled:opacity-50"
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

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-outline-variant"></div>
              <span className="flex-shrink mx-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-outline-variant"></div>
            </div>

            {/* GitHub Login Button */}
            <div>
              <button
                type="button"
                onClick={handleGitHubLogin}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-outline-variant rounded bg-[#24292e] hover:bg-[#1a1e22] text-white font-body-md text-body-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#24292e] transition-colors h-[44px] cursor-pointer"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.197 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
                </svg>
                Sign in with GitHub
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-stack_lg py-stack_md bg-surface-container-low border-t border-surface-container text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Don't have an account?{' '}
            <Link className="font-semibold text-[#1E707D] hover:text-[#165964] transition-colors" to="/register">
              Register
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}

export default LoginPage
