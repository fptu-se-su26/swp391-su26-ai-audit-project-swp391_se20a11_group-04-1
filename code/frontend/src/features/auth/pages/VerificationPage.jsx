import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import useAuthStore from '@store/useAuthStore'

function VerificationPage() {
  const { verifyStatus, userRole, login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

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

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (!email) {
      toast.error('Vui lòng nhập email công tác!')
      return
    }
    if (!file) {
      toast.error('Vui lòng tải lên ảnh thẻ giảng viên!')
      return
    }

    setLoading(true)
    // Giả lập gửi yêu cầu lên Backend
    setTimeout(() => {
      setLoading(false)
      // Cập nhật trạng thái sang PENDING
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
    }, 1200)
  }



  const resetRequest = () => {
    const currentAuth = useAuthStore.getState()
    login(
      currentAuth.userId,
      currentAuth.userRole,
      currentAuth.username,
      currentAuth.email,
      currentAuth.fullName,
      'UNVERIFIED'
    )
    setEmail('')
    setFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    toast.success('Đã hoàn tác về trạng thái chưa xác minh.')
  }

  const isFormValid = email && file

  return (
    <div className="w-full flex flex-col items-center justify-start select-none md:mt-[-20px] mt-[-10px]">
      
      {/* Container chính */}
      <div className="w-full max-w-5xl bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-8 flex flex-col">
        
        {/* Tiêu đề & Mô tả */}
        <h1 className="font-headline-md text-headline-md text-[#0ea5e9] mb-2">Xác Minh Giảng Viên/Đối Tác Doanh Nghiệp</h1>
        <p className="font-body-md text-body-md text-secondary mb-8">
          Để mở khóa tính năng classroom vui lòng cung cấp email công tác và tải lên thẻ nhân viên hoặc thẻ giảng viên của bạn để hoàn tất quá trình xác minh.
        </p>

        {/* Trạng thái hiện tại */}
        {verifyStatus === 'PENDING' && (
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
              <p className="font-semibold text-sm">Hồ sơ xác minh của bạn đang được duyệt bởi hệ thống Admin...</p>
            </div>
            <button 
              onClick={resetRequest}
              className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 dark:text-blue-300 rounded text-xs transition-colors"
            >
              Hủy & Gửi lại
            </button>
          </div>
        )}

        {verifyStatus === 'VERIFIED' && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-800 dark:text-green-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600 font-bold">verified</span>
              <p className="font-semibold text-sm">Chúc mừng! Tài khoản của bạn đã được xác minh thành công làm Giảng viên/Đối tác.</p>
            </div>
            <button 
              onClick={resetRequest}
              className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-700 dark:text-green-300 rounded text-xs transition-colors"
            >
              Đặt lại (Reset)
            </button>
          </div>
        )}

        {verifyStatus === 'REJECTED' && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-800 dark:text-red-200 flex flex-col gap-2">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 font-bold">error</span>
                <p className="font-semibold text-sm">Yêu cầu xác minh của bạn đã bị từ chối.</p>
              </div>
              <button 
                onClick={resetRequest}
                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-300 rounded text-xs transition-colors"
              >
                Gửi lại yêu cầu mới
              </button>
            </div>
            <p className="text-xs text-red-600/80 dark:text-red-300/80 mt-1">Lý do: Ảnh thẻ không rõ nét hoặc thông tin email không chính xác.</p>
          </div>
        )}

        {/* Form Yêu Cầu */}
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Email công tác */}
          <div>
            <label className="block font-semibold text-body-md text-on-surface mb-2" htmlFor="email">
              Email công tác
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant/70">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </span>
              <input
                className="w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest font-body-md text-body-md text-on-surface focus:outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-sky-100 transition-colors disabled:opacity-50"
                id="email"
                name="email"
                placeholder="giangvien@university.edu.vn"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || verifyStatus !== 'UNVERIFIED'}
              />
            </div>
          </div>

          {/* Vùng tải lên ảnh thẻ */}
          <div>
            <label className="block font-semibold text-body-md text-on-surface mb-2">
              Ảnh thẻ giảng viên/Đối tác doanh nghiệp
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={verifyStatus === 'UNVERIFIED' ? triggerFileSelect : undefined}
              className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                isDragging 
                  ? 'border-[#0ea5e9] bg-sky-500/5' 
                  : 'border-outline-variant hover:border-[#0ea5e9] bg-surface-container-lowest'
              } ${verifyStatus !== 'UNVERIFIED' ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
                disabled={verifyStatus !== 'UNVERIFIED'}
              />
              {!file && (
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/70 mb-4">
                  upload
                </span>
              )}
              {file && previewUrl ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <img src={previewUrl} alt="Preview" className="h-auto max-h-[350px] w-full object-contain rounded-md shadow-sm border border-outline-variant/30" />
                  <div className="space-y-1 text-center mt-2">
                    <p className="font-semibold text-sm text-on-surface">{file.name}</p>
                    <p className="text-xs text-on-surface-variant">Size: {(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-semibold text-sm text-on-surface mb-1">
                    Kéo thả ảnh vào đây hoặc nhấp để chọn
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Hỗ trợ: JPG, PNG, GIF (Tối đa 5MB)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Nút gửi & Nút Demo */}
          <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Nút gửi yêu cầu */}
            <button
              type="submit"
              disabled={loading || !isFormValid || verifyStatus !== 'UNVERIFIED'}
              className={`w-full sm:w-auto px-6 py-3 font-semibold rounded-lg text-sm transition-colors ${
                isFormValid && verifyStatus === 'UNVERIFIED' && !loading
                  ? 'bg-[#0ea5e9] hover:bg-[#38bdf8] text-white shadow-sm'
                  : 'bg-outline-variant/60 text-on-surface-variant/60 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                  Đang gửi...
                </span>
              ) : (
                'Submit'
              )}
            </button>


          </div>
        </form>

        {/* Lưu ý footer */}
        <div className="mt-8 pt-6 border-t border-outline-variant/50 text-[11px] text-on-surface-variant leading-relaxed">
          <strong>Lưu ý:</strong> Thời gian xử lý xác minh thường từ 1-3 ngày làm việc. Chúng tôi sẽ gửi thông báo qua email khi quá trình xác minh hoàn tất.
        </div>

      </div>
    </div>
  )
}

export default VerificationPage
