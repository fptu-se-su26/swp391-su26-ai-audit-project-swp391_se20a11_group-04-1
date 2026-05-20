import axiosInstance from '@/api/axiosConfig';

export const useCaseService = {
  // Tìm kiếm và phân trang Use Case
  searchUseCases: async (params) => {
    const response = await axiosInstance.get('/v1/use-cases/search', { params });
    return response.data.data;
  },

  // Lấy danh sách tất cả Use Case
  getAllUseCases: async () => {
    const response = await axiosInstance.get('/v1/use-cases');
    return response.data.data;
  },

  // Lấy chi tiết 1 Use Case theo ID
  getUseCaseById: async (useCaseId) => {
    const response = await axiosInstance.get(`/v1/use-cases/${useCaseId}`);
    return response.data.data;
  },

  // Tạo mới Use Case
  createUseCase: async (data) => {
    const response = await axiosInstance.post('/v1/use-cases', data);
    return response.data.data;
  },

  // Cập nhật trạng thái Use Case (Patch)
  updateUseCaseStatus: async (useCaseId, status) => {
    const response = await axiosInstance.patch(`/v1/use-cases/${useCaseId}/status`, { status });
    return response.data.data;
  },

  // Cập nhật Use Case
  updateUseCase: async (useCaseId, data) => {
    const response = await axiosInstance.put(`/v1/use-cases/${useCaseId}`, data);
    return response.data.data;
  },

  // Xóa Use Case
  deleteUseCase: async (useCaseId) => {
    const response = await axiosInstance.delete(`/v1/use-cases/${useCaseId}`);
    return response.data;
  }
};
