import React, { useState, useEffect } from 'react';
import RequirementFormHeader from './RequirementFormHeader';
import RequirementFormDetails from './RequirementFormDetails';
import RequirementFormCriteria from './RequirementFormCriteria';
import RequirementFormProperties from './RequirementFormProperties';
import AIAcceleratorsCard from './AIAcceleratorsCard';
import RequirementFormActionBar from './RequirementFormActionBar';
import { requirementApi } from '../services/requirementApi';

const CreateRequirementModal = ({ isOpen, onClose, onSuccess, editingData }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'FUNCTIONAL',
    priority: 'MEDIUM',
    evidenceRequired: false,
    tags: [],
    acceptanceCriteria: [],
    ownerId: null
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingData) {
      let parsedCriteria = [];
      if (editingData.acceptanceCriteria) {
        try {
          parsedCriteria = typeof editingData.acceptanceCriteria === 'string' 
            ? JSON.parse(editingData.acceptanceCriteria) 
            : editingData.acceptanceCriteria;
        } catch (e) {
          console.error("Failed to parse acceptance criteria", e);
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
        projectId: editingData.projectId || 1,  // preserve projectId for update
        status: editingData.status || 'IN_PROGRESS' // preserve current status
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'FUNCTIONAL',
        priority: 'MEDIUM',
        evidenceRequired: false,
        tags: [],
        acceptanceCriteria: [],
        ownerId: null
      });
    }
  }, [editingData, isOpen]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (targetStatus) => {
    if (!formData.title.trim()) {
      alert("Vui lòng nhập Requirement Title!");
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...formData,
        acceptanceCriteria: JSON.stringify(formData.acceptanceCriteria || [])
      };

      // Save Draft → DRAFT | Save Requirement → IN_PROGRESS (always, create or edit)
      payload.status = targetStatus ? targetStatus : 'IN_PROGRESS';

      if (editingData && editingData.id) {
        await requirementApi.updateRequirement(editingData.id, payload);
      } else {
        await requirementApi.createRequirement(payload);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Lỗi khi lưu Requirement:", error);
      alert("Lưu thất bại! Xem chi tiết trong Console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-6 overflow-hidden">
      {/* Modal Container */}
      <div 
        className="w-full max-w-7xl max-h-full flex flex-col bg-surface rounded-xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Scrollable Content Area */}
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

        {/* Sticky Bottom Action Bar inside Modal */}
        <RequirementFormActionBar 
          onCancel={onClose} 
          onSave={() => handleSave(null)} // Null means keep current or default to IN_REVIEW
          onSaveDraft={() => handleSave('DRAFT')} 
          loading={loading} 
        />
      </div>
    </div>
  );
};

export default CreateRequirementModal;
