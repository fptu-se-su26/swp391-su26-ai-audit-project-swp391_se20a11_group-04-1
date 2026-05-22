import React, { useEffect, useState } from 'react';
import RequirementFormHeader from './RequirementFormHeader';
import RequirementFormDetails from './RequirementFormDetails';
import RequirementFormCriteria from './RequirementFormCriteria';
import RequirementFormProperties from './RequirementFormProperties';
import AIAcceleratorsCard from './AIAcceleratorsCard';
import RequirementFormActionBar from './RequirementFormActionBar';
import { requirementApi } from '../services/requirementApi';

const emptyForm = (projectId) => ({
  title: '',
  description: '',
  type: 'FUNCTIONAL',
  priority: 'MEDIUM',
  evidenceRequired: false,
  tags: [],
  acceptanceCriteria: [],
  ownerId: null,
  projectId
});

const CreateRequirementModal = ({ isOpen, onClose, onSuccess, editingData, projectId }) => {
  const [formData, setFormData] = useState(emptyForm(projectId));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editingData) {
      setFormData(emptyForm(projectId));
      return;
    }

    let parsedCriteria = [];
    if (editingData.acceptanceCriteria) {
      try {
        parsedCriteria = typeof editingData.acceptanceCriteria === 'string'
          ? JSON.parse(editingData.acceptanceCriteria)
          : editingData.acceptanceCriteria;
      } catch (error) {
        console.error('Failed to parse acceptance criteria', error);
      }
    }

    setFormData({
      title: editingData.title || '',
      description: editingData.description || '',
      type: editingData.type || 'FUNCTIONAL',
      priority: editingData.priority || 'MEDIUM',
      evidenceRequired: editingData.evidenceRequired || false,
      tags: editingData.tags || [],
      acceptanceCriteria: Array.isArray(parsedCriteria) ? parsedCriteria : [],
      ownerId: editingData.ownerId || null,
      projectId: editingData.projectId || projectId,
      status: editingData.status || 'IN_PROGRESS'
    });
  }, [editingData, projectId]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (targetStatus) => {
    if (!formData.title.trim()) {
      alert('Please enter a Requirement Title.');
      return;
    }

    const resolvedProjectId = formData.projectId || projectId;
    if (!resolvedProjectId) {
      alert('Please select a project before creating a Requirement.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        projectId: resolvedProjectId,
        acceptanceCriteria: JSON.stringify(formData.acceptanceCriteria || []),
        status: targetStatus || 'IN_PROGRESS'
      };

      if (editingData?.id) {
        await requirementApi.updateRequirement(editingData.id, payload);
      } else {
        await requirementApi.createRequirement(payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving requirement:', error);
      alert('Save failed. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-6 overflow-hidden">
      <div
        className="w-full max-w-7xl max-h-full flex flex-col bg-surface rounded-xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex-1 overflow-y-auto p-margin_desktop">
          <RequirementFormHeader onClose={onClose} />

          <div className="grid grid-cols-12 gap-gutter items-start">
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-gutter">
              <RequirementFormDetails formData={formData} onChange={handleChange} />
              <RequirementFormCriteria formData={formData} onChange={handleChange} />
            </div>

            <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
              <RequirementFormProperties formData={formData} onChange={handleChange} />
              <AIAcceleratorsCard />
            </div>
          </div>
        </div>

        <RequirementFormActionBar
          onCancel={onClose}
          onSave={() => handleSave(null)}
          onSaveDraft={() => handleSave('DRAFT')}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default CreateRequirementModal;
