import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useCaseService } from '../services/useCaseService';
import UseCaseDetailHeader from '../components/UseCaseDetailHeader';
import UseCaseMetadataCards from '../components/UseCaseMetadataCards';
import UseCaseMainFlow from '../components/UseCaseMainFlow';
import UseCaseAlternativeFlows from '../components/UseCaseAlternativeFlows';
import UseCaseConditions from '../components/UseCaseConditions';
import UseCaseAIAnalysis from '../components/UseCaseAIAnalysis';
import toast from 'react-hot-toast';

const UseCaseDetailPage = () => {
  const { projectId, id } = useParams();
  const [useCase, setUseCase] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchUseCase = useCallback(async () => {
    try {
      const data = await useCaseService.getUseCaseById(id, projectId);
      setUseCase(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load Use Case details');
    } finally {
      setLoading(false);
    }
  }, [id, projectId]);

  useEffect(() => {
    fetchUseCase();
  }, [fetchUseCase]);

  // Enter edit mode — clone current useCase data
  const handleEdit = () => {
    setEditData({
      name: useCase.name || '',
      code: useCase.code || '',
      status: useCase.status || 'DRAFT',
      version: useCase.version || 'v1.0',
      requirementId: useCase.requirementId,
      actors: useCase.actors ? [...useCase.actors] : [],
      precondition: useCase.precondition || '',
      postcondition: useCase.postcondition || '',
      mainFlow: useCase.mainFlow ? JSON.parse(JSON.stringify(useCase.mainFlow)) : { steps: [] },
      alternativeFlow: useCase.alternativeFlow ? JSON.parse(JSON.stringify(useCase.alternativeFlow)) : { flows: [] },
      completenessScore: useCase.completenessScore || 0,
    });
    setIsEditing(true);
  };

  // Cancel edit — discard changes
  const handleCancel = () => {
    setIsEditing(false);
    setEditData(null);
  };

  // Update a field in editData
  const handleFieldChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // Handle quick status change (PATCH)
  const handleStatusChange = async (newStatus) => {
    if (newStatus === useCase.status) return;
    setUpdatingStatus(true);
    try {
      await useCaseService.updateUseCaseStatus(id, newStatus, projectId);
      toast.success('Status updated successfully!');
      // Update local state without fetching all data again
      setUseCase(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Failed to update status';
      toast.error(errorMsg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Save edited data to backend
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        code: editData.code,
        name: editData.name,
        requirementId: editData.requirementId,
        actors: editData.actors,
        status: editData.status,
        version: editData.version,
        precondition: editData.precondition,
        postcondition: editData.postcondition,
        mainFlow: editData.mainFlow,
        alternativeFlow: editData.alternativeFlow,
        completenessScore: editData.completenessScore,
      };

      await useCaseService.updateUseCase(id, payload, projectId);
      toast.success('Use Case updated successfully!');
      setIsEditing(false);
      setEditData(null);
      await fetchUseCase(); // Reload fresh data
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Failed to update Use Case';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
          <span className="text-on-surface-variant font-medium">Loading Use Case details...</span>
        </div>
      </div>
    );
  }

  if (!useCase) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-on-surface-variant font-medium">Use Case not found.</div>
      </div>
    );
  }

  // Use editData when editing, otherwise original useCase
  const displayData = isEditing ? { ...useCase, ...editData } : useCase;

  return (
    <div className="p-6 md:p-10 z-10 h-full">
      <div className="max-w-7xl mx-auto">
        <UseCaseDetailHeader 
          useCase={displayData} 
          isEditing={isEditing}
          saving={saving}
          updatingStatus={updatingStatus}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          onFieldChange={handleFieldChange}
          onStatusChange={handleStatusChange}
        />
        <UseCaseMetadataCards 
          useCase={displayData}
          isEditing={isEditing}
          onFieldChange={handleFieldChange}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-8 space-y-gutter">
            <UseCaseMainFlow 
              mainFlow={displayData.mainFlow}
              isEditing={isEditing}
              onFlowChange={(newFlow) => handleFieldChange('mainFlow', newFlow)}
            />
            <UseCaseAlternativeFlows 
              alternativeFlow={displayData.alternativeFlow} 
              mainFlow={displayData.mainFlow}
              isEditing={isEditing}
              onFlowChange={(newFlow) => handleFieldChange('alternativeFlow', newFlow)}
            />
          </div>
          
          <div className="lg:col-span-4 space-y-gutter">
            <UseCaseConditions 
              precondition={displayData.precondition} 
              postcondition={displayData.postcondition}
              isEditing={isEditing}
              onFieldChange={handleFieldChange}
            />
            <UseCaseAIAnalysis />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UseCaseDetailPage;
