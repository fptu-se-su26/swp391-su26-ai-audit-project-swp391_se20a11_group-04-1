import axiosInstance from './axiosConfig'

const unwrap = (res) => res.data?.data

export const announcementApi = {
  getAnnouncements: (classroomId, page = 0, size = 10) => {
    return axiosInstance.get(`/v1/classrooms/${classroomId}/announcements`, {
      params: { page, size }
    }).then(unwrap)
  },

  downloadAnnouncementAttachment: (classroomId, announcementId) => {
    return axiosInstance.get(`/v1/classrooms/${classroomId}/announcements/${announcementId}/download`, {
      responseType: 'blob'
    })
  },
  
  createAnnouncement: (classroomId, title, content, file) => {
    const formData = new FormData()
    formData.append('title', title)
    formData.append('content', content)
    if (file) {
      formData.append('file', file)
    }

    return axiosInstance.post(`/v1/classrooms/${classroomId}/announcements`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(unwrap)
  }
}

export default announcementApi
