import axiosInstance from '@api/axiosConfig';

export const createTestRun = async (projectId, testCaseIds, name = null) => {
    const response = await axiosInstance.post('/v1/test-runs', { projectId, testCaseIds, name });
    return response.data.data; // unwrap ApiResponse<T>
};

export const cancelTestRun = async (testRunId) => {
    if (!testRunId) throw new Error('testRunId is required');
    await axiosInstance.delete(`/v1/test-runs/${testRunId}`);
};

export const getTestRunStatus = async (testRunId) => {
    if (!testRunId) throw new Error('testRunId is required');
    const response = await axiosInstance.get(`/v1/test-runs/${testRunId}`);
    return response.data.data;
};

export const getTestRunHistory = async (testCaseId) => {
    const response = await axiosInstance.get(`/v1/test-runs/test-cases/${testCaseId}`);
    return response.data.data;
};

export const saveTestRun = async (testRunId) => {
    if (!testRunId) throw new Error('testRunId is required');
    const response = await axiosInstance.post(`/v1/test-runs/${testRunId}/save`);
    return response.data.data;
};
