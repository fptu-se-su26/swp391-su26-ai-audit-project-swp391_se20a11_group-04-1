import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import useAuthStore from '@store/useAuthStore'
import axiosInstance from '@api/axiosConfig'

function VerificationPage() {
  const { verifyStatus, userRole, login } = useAuthStore()
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [submittedImageUrl, setSubmittedImageUrl] = useState(null)
  const [imageBlobUrl, setImageBlobUrl] = useState(null)
  const [expiryDate, setExpiryDate] = useState(null)
  const [cancelMessage, setCancelMessage] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    let activeBlobUrl = null
    const fetchMyRequests = async () => {
      try {
        const res = await axiosInstance.get('/v1/mentor-verifications/me')
        if (res.data && res.data.length > 0) {
          const latestReq = res.data[0]
          const relativeUrl = latestReq.cardImageUrl
          setSubmittedImageUrl(relativeUrl)

          if (latestReq.message) {
            setCancelMessage(latestReq.message)
          } else {
            setCancelMessage(null)
          }

          if (latestReq.expiredAt) {
            const date = new Date(latestReq.expiredAt)
            const formatted = date.toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
            setExpiryDate(formatted)
          }
          
          // Remove '/api' prefix since axiosInstance baseURL already includes it
          const cleanUrl = relativeUrl.startsWith('/api') 
            ? relativeUrl.substring(4) 
            : relativeUrl
            
          const imageRes = await axiosInstance.get(cleanUrl, {
            responseType: 'blob'
          })
          activeBlobUrl = URL.createObjectURL(imageRes.data)
          setImageBlobUrl(activeBlobUrl)
        }
      } catch (error) {
        console.error('Fetch requests error:', error)
      }
    }
    fetchMyRequests()
    return () => {
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl)
      }
    }
  }, [verifyStatus])

  useEffect(() => {
    const handleVerificationUpdate = (e) => {
      const { status } = e.detail
      const currentAuth = useAuthStore.getState()
      login(
        currentAuth.userId,
        currentAuth.userRole,
        currentAuth.username,
        currentAuth.email,
        currentAuth.fullName,
        status
      )
    }

    window.addEventListener('verification-update', handleVerificationUpdate)
    return () => {
      window.removeEventListener('verification-update', handleVerificationUpdate)
    }
  }, [login])

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const selectedFile = files[0]
      if (selectedFile.type.startsWith('image/')) {
        setFile(selectedFile)
        setPreviewUrl(URL.createObjectURL(selectedFile))
        toast.success(`Đã chọn tệp: ${selectedFile.name}`)
      } else {
        toast.error('Chỉ hỗ trợ tệp ảnh (JPG, PNG, GIF)!')
      }
    }
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      const selectedFile = files[0]
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
      toast.success(`Đã chọn tệp: ${selectedFile.name}`)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current.click()
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      toast.error('Vui lòng tải lên ảnh thẻ giảng viên!')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('idCardImage', file)
      
      // Gọi API thực tế tải ảnh lên DB và Cloudinary
      await axiosInstance.post('/v1/mentor-verifications/request', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // Cập nhật trạng thái store sang PENDING sau khi backend trả về thành công
      const currentAuth = useAuthStore.getState()
      login(
        currentAuth.userId,
        currentAuth.userRole,
        currentAuth.username,
        currentAuth.email,
        currentAuth.fullName,
        'PENDING'
      )
      toast.success('Gửi yêu cầu xác minh thành công! Đang chờ duyệt.')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.error || 'Tải ảnh thất bại. Vui lòng kiểm tra lại.')
    } finally {
      setLoading(false)
    }
  }



  const resetRequest = async () => {
    try {
      setLoading(true)
      // Xoá request trên Backend
      await axiosInstance.delete('/v1/mentor-verifications/request')
      
      const currentAuth = useAuthStore.getState()
      login(
        currentAuth.userId,
        currentAuth.userRole,
        currentAuth.username,
        currentAuth.email,
        currentAuth.fullName,
        'UNVERIFIED'
      )
      setFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      toast.success('Đã hoàn tác về trạng thái chưa xác minh.')
    } catch (error) {
      console.error('Cancel request error:', error)
      toast.error(error.response?.data?.error || 'Có lỗi khi hoàn tác. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = !!file

  return (
    <div className="w-full flex flex-col items-center justify-start select-none pt-0 pb-4">
      
      {/* Container chính */}
      <div className="w-full max-w-4xl bg-surface-container-lowest/80 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-6 md:p-8 flex flex-col relative overflow-hidden transition-all duration-500 hover:shadow-[0_8px_40px_rgba(14,165,233,0.08)]">
        
        {/* Lớp phủ gradient chìm (Glow background) */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#0ea5e9]/20 to-[#38bdf8]/5 blur-3xl pointer-events-none"></div>

        {/* Tiêu đề & Mô tả */}
        <div className="relative z-10 mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0ea5e9] to-[#38bdf8] bg-clip-text text-transparent mb-3 tracking-tight">
            Xác Minh Giảng Viên / Đối Tác
          </h1>
          <p className="text-[15px] text-on-surface-variant/80 max-w-2xl leading-relaxed">
            Để mở khóa các tính năng nâng cao, vui lòng tải lên hình ảnh thẻ nhân viên hoặc thẻ giảng viên của bạn. Thông tin sẽ được bảo mật và xử lý nhanh chóng.
          </p>
        </div>

        {/* Trạng thái hiện tại */}
        {verifyStatus === 'PENDING' && (
          <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-[#0ea5e9]/10 to-[#38bdf8]/5 border border-[#0ea5e9]/20 shadow-lg shadow-[#0ea5e9]/5 backdrop-blur-md transition-all duration-300">
            {/* Thanh loading chạy ngang mượt mà */}
            <div className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-[#0ea5e9] to-transparent w-1/2 animate-[shimmer_2s_infinite]"></div>
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] shadow-inner">
                  <span className="material-symbols-outlined text-2xl animate-pulse">hourglass_top</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#0ea5e9]">Đang xử lý xác minh</h3>
                  <p className="text-sm text-on-surface-variant/80 mt-1">Hồ sơ xác minh của bạn đang được duyệt bởi hệ thống Admin. Quá trình này có thể mất một chút thời gian.</p>
                </div>
              </div>
              <button 
                onClick={resetRequest}
                className="shrink-0 px-5 py-2 bg-surface-container hover:bg-[#0ea5e9]/10 text-[#0ea5e9] border border-outline-variant hover:border-[#0ea5e9]/30 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow active:scale-95"
              >
                Hủy & Gửi lại
              </button>
            </div>
          </div>
        )}

        {verifyStatus === 'VERIFIED' && (
          <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-400/5 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 backdrop-blur-md transition-all duration-300">
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-inner">
                  <span className="material-symbols-outlined text-2xl font-bold">verified</span>
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-600 dark:text-emerald-400">Xác minh thành công</h3>
                  <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80 mt-1">Chúc mừng! Tài khoản của bạn đã được nâng cấp làm Giảng viên/Đối tác.</p>
                  {expiryDate && (
                    <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90 mt-1 flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      Hiệu lực đến: {expiryDate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {verifyStatus === 'REJECTED' && (
          <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-red-500/10 to-rose-400/5 border border-red-500/20 shadow-lg shadow-red-500/5 backdrop-blur-md transition-all duration-300">
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 shadow-inner mt-1 sm:mt-0">
                  <span className="material-symbols-outlined text-2xl font-bold">error</span>
                </div>
                <div>
                  <h3 className="font-semibold text-red-600 dark:text-red-400">Yêu cầu bị từ chối</h3>
                  <p className="text-sm text-red-700/80 dark:text-red-300/80 mt-1">Lý do: {cancelMessage || 'Ảnh thẻ không rõ nét, bị mờ hoặc không hợp lệ. Vui lòng chụp lại ảnh khác rõ ràng hơn.'}</p>
                </div>
              </div>
              <button 
                onClick={resetRequest}
                className="shrink-0 px-5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/20 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95"
              >
                Gửi lại yêu cầu
              </button>
            </div>
          </div>
        )}

        {/* Khu Vực Tải Lên Hoặc Hiển Thị */}
        {verifyStatus === 'UNVERIFIED' ? (
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {cancelMessage && (
              <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-400/5 border border-amber-500/20 shadow-lg shadow-amber-500/5 backdrop-blur-md transition-all duration-300">
                <div className="p-4 flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow-inner shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-xl font-bold">warning</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-600 dark:text-amber-400 text-sm">Thông báo thay đổi quyền hạn</h4>
                    <p className="text-xs text-amber-700/95 dark:text-amber-300/95 mt-1 leading-relaxed">{cancelMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Vùng tải lên ảnh thẻ */}
            <div className="relative z-10">
              <label className="block text-sm font-semibold text-on-surface mb-3">
                Khu vực tải lên tài liệu <span className="text-red-500">*</span>
              </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={verifyStatus === 'UNVERIFIED' ? triggerFileSelect : undefined}
              className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group ${
                isDragging 
                  ? 'border-[#0ea5e9] bg-[#0ea5e9]/5 shadow-[0_0_30px_rgba(14,165,233,0.15)] scale-[1.01]' 
                  : 'border-outline-variant hover:border-[#0ea5e9]/50 bg-surface-container-lowest hover:bg-surface-container/50 hover:shadow-md'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
              {!file && (
                <>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                    isDragging ? 'bg-[#0ea5e9] text-white shadow-lg shadow-[#0ea5e9]/30 scale-110' : 'bg-surface-container-highest text-on-surface-variant group-hover:bg-[#0ea5e9]/10 group-hover:text-[#0ea5e9] group-hover:-translate-y-1'
                  }`}>
                    <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                  </div>
                  <p className="font-semibold text-base text-on-surface mb-2 transition-colors group-hover:text-[#0ea5e9]">
                    Kéo thả ảnh vào đây hoặc nhấp để tải lên
                  </p>
                  <p className="text-sm text-on-surface-variant/70">
                    Chỉ hỗ trợ file ảnh: JPG, PNG, GIF (Tối đa 5MB)
                  </p>
                </>
              )}
              {file && previewUrl && (
                <div className="flex flex-col items-center w-full animate-fade-in">
                  <div className="relative group/image">
                    <img src={previewUrl} alt="Preview" className="h-auto max-h-[280px] w-auto object-contain rounded-xl shadow-lg border border-outline-variant/30 transition-transform duration-300 group-hover/image:scale-[1.02]" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center backdrop-blur-[2px]">
                      <span className="text-white flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full text-sm font-medium">
                        <span className="material-symbols-outlined text-lg">edit</span> Thay đổi ảnh
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 px-4 py-2 bg-surface-container-high rounded-lg flex items-center gap-3 border border-outline-variant/30 shadow-sm">
                    <span className="material-symbols-outlined text-[#0ea5e9]">image</span>
                    <div className="text-left">
                      <p className="font-medium text-sm text-on-surface truncate max-w-[200px] sm:max-w-[300px]">{file.name}</p>
                      <p className="text-xs text-on-surface-variant">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Nút gửi */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`relative overflow-hidden w-full sm:w-auto px-8 py-3.5 font-semibold rounded-xl text-sm transition-all duration-300 active:scale-95 ${
                isFormValid && !loading
                  ? 'bg-gradient-to-r from-[#0ea5e9] to-[#38bdf8] hover:shadow-[0_4px_20px_rgba(14,165,233,0.3)] hover:-translate-y-0.5 text-white'
                  : 'bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2 text-white/90">
                  <span className="material-symbols-outlined text-[18px] animate-pulse">hourglass_empty</span>
                  Đang xử lý...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Gửi Yêu Cầu <span className="material-symbols-outlined text-[18px]">send</span>
                </span>
              )}
            </button>
          </div>
        </form>
        ) : (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-on-surface mb-3">
              Tài liệu đã gửi
            </label>
            <div className="border border-outline-variant/30 rounded-2xl p-6 bg-surface-container-lowest flex flex-col items-center">
              {imageBlobUrl || previewUrl ? (
                <img 
                  src={imageBlobUrl || previewUrl} 
                  alt="Submitted Document" 
                  className="h-auto max-h-[300px] w-auto object-contain rounded-xl shadow-lg border border-outline-variant/30" 
                />
              ) : (
                <div className="text-on-surface-variant flex items-center gap-2 py-10">
                  <span className="material-symbols-outlined animate-spin">refresh</span> Đang tải tài liệu...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lưu ý footer */}
        <div className="mt-8 pt-6 border-t border-outline-variant/30 flex items-start gap-3">
          <span className="material-symbols-outlined text-[#0ea5e9]/70 text-xl shrink-0 mt-0.5">info</span>
          <p className="text-[13px] text-on-surface-variant/70 leading-relaxed">
            <strong className="text-on-surface-variant/90">Thông tin bảo mật:</strong> Dữ liệu của bạn được mã hóa an toàn. Thời gian xử lý xác minh thường từ 1-3 ngày làm việc. Chúng tôi sẽ gửi thông báo qua hệ thống khi quá trình xác minh hoàn tất.
          </p>
        </div>

      </div>
    </div>
  )
}

export default VerificationPage
