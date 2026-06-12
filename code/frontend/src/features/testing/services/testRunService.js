import axiosInstance from '@api/axiosConfig';

export const createTestRun = async (projectId, testCaseIds, name = null) => {
    const response = await axiosInstance.post('/v1/test-runs', { projectId, testCaseIds, name });
    return response.data.data; // unwrap ApiResponse<T>
};

export const cancelTestRun = async (testRunId) => {
    await axiosInstance.delete(`/v1/test-runs/${testRunId}`);
};

export const getTestRunStatus = async (testRunId) => {
    const response = await axiosInstance.get(`/v1/test-runs/${testRunId}`);
    return response.data.data;
};

export const getTestRunHistory = async (testCaseId) => {
    const response = await axiosInstance.get(`/v1/test-runs/test-cases/${testCaseId}`);
    return response.data.data;
};

export const saveTestRun = async (testRunId) => {
    const response = await axiosInstance.post(`/v1/test-runs/${testRunId}/save`);
    return response.data.data;
};
