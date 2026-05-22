import axios from 'axios'

// Base URL khi build production trỏ vào backend
// Khi dev: Vite proxy /api → localhost:8080
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ Quan trọng: Tự động gửi và nhận Session Cookie (JSESSIONID) giữa client và server
})

// ✅ Response Interceptor: xử lý khi phiên hết hạn hoặc lỗi 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isLoginRequest = error.config?.url?.endsWith('/v1/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      // Khi phiên đăng nhập hết hạn hoặc bị từ chối, chuyển hướng về trang login
      localStorage.removeItem('userId')
      localStorage.removeItem('userRole')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
