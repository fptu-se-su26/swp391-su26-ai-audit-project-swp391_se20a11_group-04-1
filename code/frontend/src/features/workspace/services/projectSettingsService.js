import axiosInstance from '@api/axiosConfig'

const unwrap = (res) => res.data?.data

export const projectSettingsService = {
  /** Update general info + appearance of a project */
  updateProject: (projectId, payload) =>
    axiosInstance.put(`/v1/projects/${projectId}`, payload).then(unwrap),

  /** Upload a cover image — returns { url: string } */
  uploadCoverImage: (projectId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return axiosInstance
      .post(`/v1/projects/${projectId}/cover-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(unwrap)
  },
}

export default projectSettingsService
