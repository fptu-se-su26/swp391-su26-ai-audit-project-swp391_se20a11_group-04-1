import axiosClient from './axiosConfig';

export const resourceApi = {
    getClassroomResources: (classroomId) => 
        axiosClient.get(`/v1/classrooms/${classroomId}/resources`),

    downloadResource: (classroomId, resourceId) => 
        axiosClient.get(`/v1/classrooms/${classroomId}/resources/${resourceId}/download`, { responseType: 'blob' }),

    uploadFileResource: (classroomId, name, file) => {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('file', file);
        return axiosClient.post(`/v1/classrooms/${classroomId}/resources/file`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    addLinkResource: (classroomId, name, url) => {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('url', url);
        return axiosClient.post(`/v1/classrooms/${classroomId}/resources/link`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // The controller expects @RequestParam, which handles form data
            },
        });
    },

    deleteResource: (classroomId, resourceId) => 
        axiosClient.delete(`/v1/classrooms/${classroomId}/resources/${resourceId}`),
};
