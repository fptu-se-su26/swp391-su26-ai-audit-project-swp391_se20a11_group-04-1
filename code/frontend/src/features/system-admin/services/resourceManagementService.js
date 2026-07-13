import axiosInstance from '@api/axiosConfig';

export const getKubernetesStatus = async () => {
  const response = await axiosInstance.get('/v1/admin/resources/kubernetes');
  return response.data?.data;
};

export const getKafkaStatus = async () => {
  const response = await axiosInstance.get('/v1/admin/resources/kafka');
  return response.data?.data;
};
