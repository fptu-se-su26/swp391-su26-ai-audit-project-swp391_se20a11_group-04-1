import axiosClient from './axiosConfig';

export const classroomApi = {
  createClassroom: (data) => {
    return axiosClient.post('/v1/classrooms', data);
  },
  
  getMyClassrooms: (params) => {
    return axiosClient.get('/v1/classrooms', { params });
  }
};
