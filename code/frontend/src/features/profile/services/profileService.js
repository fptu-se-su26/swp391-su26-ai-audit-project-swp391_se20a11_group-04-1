import axiosInstance from '@api/axiosConfig'

const unwrap = (res) => res.data?.data

export const profileService = {
  getProfile: (userId) => axiosInstance.get(userId ? `/v1/profile/${userId}` : '/v1/profile').then(unwrap),
  getProfileStatistics: (userId) => axiosInstance.get(userId ? `/v1/profile/${userId}/statistics` : '/v1/profile/statistics').then(unwrap),
  getCoWorkers: (userId) => axiosInstance.get(userId ? `/v1/profile/${userId}/coworkers` : '/v1/profile/coworkers').then(unwrap),
  updateProfile: (payload) => axiosInstance.put('/v1/profile', payload).then(unwrap),
  changePassword: (payload) => axiosInstance.put('/v1/profile/password', payload).then(unwrap),
  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return axiosInstance.post('/v1/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(unwrap)
  },
  getGithubStatus: () => axiosInstance.get('/v1/github/status').then(unwrap),
  getGithubAuthUrl: () => axiosInstance.get('/v1/github/auth-url').then(unwrap),
  disconnectGithub: () => axiosInstance.delete('/v1/github/disconnect').then(unwrap),
}

export default profileService
