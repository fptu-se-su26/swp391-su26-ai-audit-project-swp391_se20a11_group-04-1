import { useState, useEffect } from 'react';
import { useCaseService } from '../services/useCaseService';
import { generatePlantUMLUrl } from '../utils/plantUMLGenerator';
import toast from 'react-hot-toast';

export const useGlobalUMLMap = (projectId) => {
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndRenderMap = async () => {
      if (!projectId) return;
      setLoading(true);
      try {
        const data = await useCaseService.searchUseCases({ projectId, page: 0, size: 1000 });
        const useCases = data.content || [];

        if (useCases.length === 0) {
          setImgUrl(null);
          setLoading(false);
          return;
        }

        const url = generatePlantUMLUrl(useCases, "System");
        setImgUrl(url);
      } catch (error) {
        console.error('Failed to generate UML map', error);
        toast.error('Lỗi UML: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAndRenderMap();
  }, [projectId]);

  return { imgUrl, loading };
};
