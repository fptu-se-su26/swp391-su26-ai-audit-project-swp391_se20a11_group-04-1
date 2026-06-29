import axiosInstance from '@/api/axiosConfig';

/**
 * Evidence Service — API calls for Evidence CRUD operations
 * Follows the same pattern as useCaseService.js
 */
export const evidenceService = {
  // Tìm kiếm và phân trang Evidence
  searchEvidence: async (params) => {
    try {
      console.log('📡 [searchEvidence] Gửi request đến: /v1/evidence/search', 'params:', params);
      const response = await axiosInstance.get('/v1/evidence/search', { params });
      console.log('✅ [searchEvidence] Nhận response thành công!', response);
      console.log('✅ [searchEvidence] response.data:', response.data);
      console.log('✅ [searchEvidence] response.data.data:', response.data?.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ [searchEvidence] Lỗi API! URL:', error.config?.url);
      console.error('❌ [searchEvidence] Status Code:', error.response?.status);
      console.error('❌ [searchEvidence] Lỗi Response Data:', error.response?.data);
      throw error;
    }
  },

  // Lấy chi tiết 1 Evidence theo ID
  getEvidenceById: async (evidenceId, projectId) => {
    const response = await axiosInstance.get(`/v1/evidence/${evidenceId}`, { params: { projectId } });
    return response.data.data;
  },

  // Tạo mới Evidence (hỗ trợ multipart/form-data cho file upload)
  createEvidence: async (formData) => {
    const response = await axiosInstance.post('/v1/evidence', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  // Cập nhật Evidence
  updateEvidence: async (evidenceId, data, projectId) => {
    const response = await axiosInstance.put(`/v1/evidence/${evidenceId}`, data, { params: { projectId } });
    return response.data.data;
  },

  // Cập nhật trạng thái Evidence (review: accept / reject / needs_clarification)
  updateEvidenceStatus: async (evidenceId, status, comment, projectId) => {
    const response = await axiosInstance.patch(`/v1/evidence/${evidenceId}/status`, { status, comment }, { params: { projectId } });
    return response.data.data;
  },

  // Xóa Evidence
  deleteEvidence: async (evidenceId, projectId) => {
    const response = await axiosInstance.delete(`/v1/evidence/${evidenceId}`, { params: { projectId } });
    return response.data;
  },

  // Thêm liên kết Entity cho Evidence
  linkEvidence: async (evidenceId, entityType, entityId, projectId) => {
    const response = await axiosInstance.post(`/v1/evidence/${evidenceId}/links`, { entityType, entityId }, { params: { projectId } });
    return response.data.data;
  },

  // Xóa liên kết Entity khỏi Evidence
  unlinkEvidence: async (evidenceId, linkId, projectId) => {
    const response = await axiosInstance.delete(`/v1/evidence/${evidenceId}/links/${linkId}`, { params: { projectId } });
    return response.data;
  },
};
