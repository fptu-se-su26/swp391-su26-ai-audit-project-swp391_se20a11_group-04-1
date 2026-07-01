import axiosInstance from '@api/axiosConfig'

/**
 * Service đóng gói các thao tác gọi API liên quan đến Authentication và Registration
 */
export const authService = {
  /**
   * Gọi API đăng nhập tài khoản
   * @param {string} usernameOrEmail - Tên đăng nhập hoặc địa chỉ email
   * @param {string} password - Mật khẩu đăng nhập
   * @returns {Promise<any>} Response từ axiosInstance
   */
  login: async (usernameOrEmail, password) => {
    return axiosInstance.post('/v1/auth/login', {
      usernameOrEmail,
      password,
    })
  },

  /**
   * Gửi yêu cầu đăng ký tài khoản mới (Step 1: Yêu cầu OTP)
   * @param {Object} payload - Dữ liệu đăng ký từ form
   * @param {string} payload.fullName - Họ và tên
   * @param {string} payload.username - Tên tài khoản đăng nhập
   * @param {string} payload.email - Địa chỉ email nhận OTP
   * @param {string} payload.password - Mật khẩu tài khoản
   * @param {string} [payload.phone] - Số điện thoại liên hệ
   * @returns {Promise<any>} Response từ axiosInstance
   */
  registerRequest: async (payload) => {
    return axiosInstance.post('/v1/auth/register/request', payload)
  },

  /**
   * Gọi API xác thực OTP để hoàn tất đăng ký tài khoản (Step 2: Xác nhận)
   * @param {string} email - Email tài khoản cần kích hoạt
   * @param {string} otp - Mã OTP gồm 6 chữ số
   * @returns {Promise<any>} Response từ axiosInstance
   */
  registerVerify: async (email, otp) => {
    return axiosInstance.post('/v1/auth/register/verify', {
      email,
      otp,
    })
  },

  /**
   * Lấy thông tin tài khoản người dùng hiện tại đang đăng nhập
   * @returns {Promise<any>} Response từ axiosInstance
   */
  getMe: async () => {
    return axiosInstance.get('/v1/auth/me')
  },

  /**
   * Gửi đơn kháng cáo cho tài khoản bị khóa
   */
  submitAppeal: async (userId, usernameOrEmail, reason, evidenceUrl, evidenceName) => {
    return axiosInstance.post('/v1/auth/appeal', {
      usernameOrEmail,
      reason,
      evidenceUrl,
      evidenceName
    })
  },

  /**
   * Lấy URL để chuyển hướng sang GitHub đăng nhập
   */
  getGitHubLoginUrl: async () => {
    return axiosInstance.get('/v1/auth/github/url')
  },

  /**
   * Đăng nhập bằng mã code của GitHub OAuth
   */
  loginWithGitHub: async (code) => {
    return axiosInstance.post('/v1/auth/github/login', { code })
  },
}

export default authService
