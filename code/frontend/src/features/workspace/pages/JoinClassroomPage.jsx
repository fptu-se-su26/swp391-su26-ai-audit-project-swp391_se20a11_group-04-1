import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axiosClient from '@api/axiosConfig'
import useAuthStore from '@store/useAuthStore'
import toast from 'react-hot-toast'

export default function JoinClassroomPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  
  const [loading, setLoading] = useState(true)
  const [classroom, setClassroom] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) {
      setError('Không tìm thấy mã mời.')
      setLoading(false)
      return
    }

    const verifyToken = async () => {
      try {
        const { data } = await axiosClient.get(`/v1/classrooms/join?token=${token}`)
        if (data.success) {
          setClassroom(data.data)
        } else {
          setError(data.message || 'Mã mời không hợp lệ.')
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi xác thực mã mời.')
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [token])

  const handleJoinClassroom = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tham gia lớp học.')
      navigate('/login', { state: { returnUrl: `/classrooms/join?token=${token}` } })
      return
    }
    
    try {
      setLoading(true)
      const { data } = await axiosClient.post(`/v1/classrooms/join?token=${token}`)
      if (data.success) {
        toast.success('Tham gia lớp học thành công!')
        navigate('/classrooms')
      } else {
        toast.error(data.message || 'Có lỗi xảy ra.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tham gia lớp học.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Đang xác thực thông tin...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-xl shadow-slate-200/50 p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl">error</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Không thể tham gia</h1>
          <p className="text-slate-600 mb-8">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl shadow-slate-200/50 p-8 text-center border border-slate-100">
        <div className="w-20 h-20 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <span className="material-symbols-outlined text-4xl">school</span>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Tham gia lớp học</h1>
        <p className="text-slate-600 mb-6">
          Bạn đã được mời tham gia lớp học <span className="font-bold text-sky-600">{classroom?.subject} ({classroom?.semester})</span>.
        </p>

        <div className="bg-slate-50 rounded-xl p-4 mb-8 text-left border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mentor</div>
          <div className="font-medium text-slate-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-slate-400">person</span>
            {classroom?.owner?.fullName || 'Chưa cập nhật'}
          </div>
        </div>

        <button 
          onClick={handleJoinClassroom}
          className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-sky-500/30 transition-all hover:-translate-y-0.5"
        >
          Tham gia lớp học này
        </button>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full mt-3 bg-transparent hover:bg-slate-50 text-slate-500 font-bold py-3 rounded-xl transition-colors"
        >
          Hủy bỏ
        </button>
      </div>
    </div>
  )
}
