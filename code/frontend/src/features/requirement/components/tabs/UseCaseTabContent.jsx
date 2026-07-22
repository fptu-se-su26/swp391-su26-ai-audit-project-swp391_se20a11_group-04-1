import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UseCaseList from '../UseCaseList';
import { useCaseService } from '../../services/useCaseService';
import toast from 'react-hot-toast';

const UseCaseTabContent = ({ useCases, requirement, onOpenUseCaseModal }) => {
  const { projectId } = useParams();
  const [localUseCases, setLocalUseCases] = useState([]);

  useEffect(() => {
    setLocalUseCases(useCases || []);
  }, [useCases]);

  if (!localUseCases || localUseCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-[24px]">emoji_people</span>
        </div>
        <p className="text-slate-600 text-sm mb-4">No use cases linked to this requirement yet</p>
      </div>
    );
  }

  const handleReorder = async (newItems) => {
    setLocalUseCases(newItems);
    try {
      const ids = newItems.map(item => item.id);
      await useCaseService.reorderUseCases(projectId, requirement.id, ids);
    } catch (error) {
      console.error('Failed to reorder use cases:', error);
      toast.error('Failed to save order');
      setLocalUseCases(useCases); // revert
    }
  };

  return (
    <div className="w-full">
      <UseCaseList 
        useCases={localUseCases}
        enableReorder={true}
        onReorder={handleReorder}
      />
    </div>
  );
};

export default UseCaseTabContent;
