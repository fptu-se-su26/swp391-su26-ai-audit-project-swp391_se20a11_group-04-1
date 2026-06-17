import axiosInstance from '@api/axiosConfig'

const unwrap = (res) => res.data?.data

export const profileService = {
  getProfile: () => axiosInstance.get('/v1/profile').then(unwrap),
  getProfileStatistics: () => axiosInstance.get('/v1/profile/statistics').then(unwrap),
  getCoWorkers: () => axiosInstance.get('/v1/profile/coworkers').then(unwrap),
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
}

export default profileService
