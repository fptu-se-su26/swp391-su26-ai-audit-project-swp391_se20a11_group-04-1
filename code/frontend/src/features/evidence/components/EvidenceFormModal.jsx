import React, { useState, useEffect, useRef } from 'react';
import useProjectStore from '../../../store/useProjectStore';
import { requirementApi } from '../../requirement/services/requirementApi';
import { testCaseService } from '../../testing/services/testCaseService';
import { EVIDENCE_TYPES } from './EvidenceToolbar';

// Evidence types that support file upload
const FILE_UPLOAD_TYPES = ['SCREENSHOT', 'SCREEN_RECORDING', 'DOCUMENT', 'DB_DIAGRAM', 'SURVEY', 'TEST_RESULT'];
// Evidence types that use external URL
const URL_TYPES = ['GITHUB_COMMIT', 'API_RESPONSE', 'FIGMA_LINK', 'DEPLOY_LINK'];

/**
 * EvidenceFormModal — Modal form cho Create / Edit evidence
 */
const EvidenceFormModal = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const isEditMode = !!editData;
  const fileInputRef = useRef(null);
  const activeProject = useProjectStore(state => state.activeProject);

  const [formData, setFormData] = useState({
    title: '',
    type: 'SCREENSHOT',
    description: '',
    externalUrl: '',
    file: null,
    linkedEntities: [],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (editData) {
      setFormData({
        title: editData.title || '',
        type: editData.type || 'SCREENSHOT',
        description: editData.description || '',
        externalUrl: editData.externalUrl || editData.external_url || '',
        file: null,
        linkedEntities: editData.evidenceLinks?.map((l) => ({
          entityType: l.entityType,
          entityId: l.entityId,
        })) || [],
      });
    } else {
      setFormData({
        title: '',
        type: 'SCREENSHOT',
        description: '',
        externalUrl: '',
        file: null,
        linkedEntities: [],
      });
    }
    setErrors({});
  }, [editData, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleChange('file', file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleChange('file', file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.type) newErrors.type = 'Type is required';

    if (URL_TYPES.includes(formData.type) && !formData.externalUrl.trim()) {
      newErrors.externalUrl = 'URL is required for this evidence type';
    }

    if (FILE_UPLOAD_TYPES.includes(formData.type) && !isEditMode && !formData.file) {
      newErrors.file = 'File is required for this evidence type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Build form data for API
      const apiData = new FormData();
      apiData.append('title', formData.title.trim());
      apiData.append('type', formData.type);
      if (formData.description.trim()) {
        apiData.append('description', formData.description.trim());
      }
      if (formData.externalUrl.trim()) {
        apiData.append('externalUrl', formData.externalUrl.trim());
      }
      if (formData.file) {
        apiData.append('file', formData.file);
      }
      if (formData.linkedEntities.length > 0) {
        apiData.append('linkedEntities', JSON.stringify(formData.linkedEntities));
      }

      if (onSuccess) {
        await onSuccess(apiData, isEditMode ? editData.id : null);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save evidence:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add linked entity
  const [linkInput, setLinkInput] = useState({ entityType: 'REQUIREMENT', entityId: '', entityLabel: '' });
  const [targetOptions, setTargetOptions] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);

  useEffect(() => {
    if (!isOpen || !activeProject?.id || !linkInput.entityType) return;
    
    setLoadingTargets(true);
    setLinkInput(prev => ({ ...prev, entityId: '', entityLabel: '' }));
    
    const fetchTargets = async () => {
      try {
        let options = [];
        if (linkInput.entityType === 'REQUIREMENT') {
          const res = await requirementApi.getAllRequirements({ projectId: activeProject.id });
          const data = res.items || res.data?.content || res.data || res || [];
          options = data.map(item => ({ id: item.id, code: item.reqCode || `REQ-${item.id}`, title: item.title }));
        } else if (linkInput.entityType === 'TEST_CASE') {
          const res = await testCaseService.getTestCases(activeProject.id, {});
          const data = res.items || res.data?.content || res.data || res || [];
          options = data.map(item => ({ id: item.id, code: item.tcCode || item.code || `TC-${item.id}`, title: item.title }));
        }
        setTargetOptions(options);
      } catch (err) {
        console.error("Failed to load targets", err);
        setTargetOptions([]);
      } finally {
        setLoadingTargets(false);
      }
    };
    
    fetchTargets();
  }, [linkInput.entityType, activeProject?.id, isOpen]);

  const handleTargetChange = (e) => {
    const selectedId = e.target.value;
    const selectedOpt = targetOptions.find(opt => String(opt.id) === selectedId);
    setLinkInput(prev => ({
      ...prev,
      entityId: selectedId,
      entityLabel: selectedOpt ? `[${selectedOpt.code}] ${selectedOpt.title}` : ''
    }));
  };

  const addLinkedEntity = () => {
    if (!linkInput.entityId) return;
    const exists = formData.linkedEntities.some(
      (l) => l.entityType === linkInput.entityType && String(l.entityId) === String(linkInput.entityId)
    );
    if (exists) return;

    setFormData((prev) => ({
      ...prev,
      linkedEntities: [...prev.linkedEntities, { ...linkInput, entityId: Number(linkInput.entityId), entityLabel: linkInput.entityLabel }],
    }));
    setLinkInput((prev) => ({ ...prev, entityId: '', entityLabel: '' }));
  };

  const removeLinkedEntity = (idx) => {
    setFormData((prev) => ({
      ...prev,
      linkedEntities: prev.linkedEntities.filter((_, i) => i !== idx),
    }));
  };

  if (!isOpen) return null;

  const showFileUpload = FILE_UPLOAD_TYPES.includes(formData.type);
  const showUrlInput = URL_TYPES.includes(formData.type);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden animate-[fadeInUp_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-fixed/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[20px]">
                {isEditMode ? 'edit_note' : 'upload_file'}
              </span>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              {isEditMode ? 'Edit Evidence' : 'Upload Evidence'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block font-body-md text-body-md text-on-surface font-medium mb-1.5">
              Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Login Success Verification"
              className={`w-full px-3 py-2.5 border rounded-lg font-body-md text-body-md text-on-surface bg-surface-container-lowest outline-none focus:ring-2 transition-all ${
                errors.title
                  ? 'border-error focus:ring-error/30'
                  : 'border-outline-variant focus:border-primary focus:ring-primary-fixed-dim'
              }`}
            />
            {errors.title && (
              <p className="mt-1 font-body-md text-[12px] text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {errors.title}
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block font-body-md text-body-md text-on-surface font-medium mb-1.5">
              Evidence Type <span className="text-error">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-3 py-2.5 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface bg-surface-container-lowest outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all cursor-pointer"
            >
              {EVIDENCE_TYPES.filter((t) => t.value !== '').map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block font-body-md text-body-md text-on-surface font-medium mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe what this evidence demonstrates..."
              rows={3}
              className="w-full px-3 py-2.5 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface bg-surface-container-lowest outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all resize-none"
            />
          </div>

          {/* File Upload (conditional) */}
          {showFileUpload && (
            <div>
              <label className="block font-body-md text-body-md text-on-surface font-medium mb-1.5">
                Upload File {!isEditMode && <span className="text-error">*</span>}
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-primary bg-primary-fixed/10'
                    : errors.file
                    ? 'border-error bg-error-container/10'
                    : 'border-outline-variant hover:border-primary/50 hover:bg-surface-container-low'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept={formData.type === 'SCREEN_RECORDING' ? 'video/*' : formData.type === 'DOCUMENT' ? '.pdf,.doc,.docx' : 'image/*,.pdf'}
                />
                {formData.file ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[24px]">check_circle</span>
                    <span className="font-body-md text-body-md text-on-surface font-medium">{formData.file.name}</span>
                    <span className="font-body-md text-[12px] text-on-surface-variant">
                      ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[36px] text-outline-variant mb-2 block">cloud_upload</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Drag & drop a file here, or <span className="text-primary font-medium">click to browse</span>
                    </p>
                    <p className="font-body-md text-[12px] text-outline mt-1">Max 50MB</p>
                  </>
                )}
              </div>
              {errors.file && (
                <p className="mt-1 font-body-md text-[12px] text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {errors.file}
                </p>
              )}
            </div>
          )}

          {/* External URL (conditional) */}
          {showUrlInput && (
            <div>
              <label className="block font-body-md text-body-md text-on-surface font-medium mb-1.5">
                External URL <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  link
                </span>
                <input
                  type="url"
                  value={formData.externalUrl}
                  onChange={(e) => handleChange('externalUrl', e.target.value)}
                  placeholder={
                    formData.type === 'GITHUB_COMMIT'
                      ? 'https://github.com/user/repo/commit/abc123'
                      : formData.type === 'FIGMA_LINK'
                      ? 'https://www.figma.com/file/...'
                      : 'https://...'
                  }
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-lg font-body-md text-body-md text-on-surface bg-surface-container-lowest outline-none focus:ring-2 transition-all ${
                    errors.externalUrl
                      ? 'border-error focus:ring-error/30'
                      : 'border-outline-variant focus:border-primary focus:ring-primary-fixed-dim'
                  }`}
                />
              </div>
              {errors.externalUrl && (
                <p className="mt-1 font-body-md text-[12px] text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {errors.externalUrl}
                </p>
              )}
            </div>
          )}

          {/* Entity Linking */}
          <div>
            <label className="block font-body-md text-body-md text-on-surface font-medium mb-1.5">
              Link to Entities
            </label>
            <div className="flex items-center gap-2 mb-2">
              <select
                value={linkInput.entityType}
                onChange={(e) => setLinkInput((prev) => ({ ...prev, entityType: e.target.value }))}
                className="w-1/3 px-3 py-2 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface bg-surface-container-lowest outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all cursor-pointer"
              >
                <option value="REQUIREMENT">Requirement</option>
                <option value="TASK">Task</option>
                <option value="TEST_CASE">Test Case</option>
              </select>
              <select
                value={linkInput.entityId}
                onChange={handleTargetChange}
                disabled={loadingTargets || targetOptions.length === 0}
                className="flex-1 px-3 py-2 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface bg-surface-container-lowest outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all cursor-pointer"
              >
                <option value="" disabled>
                  {loadingTargets ? 'Loading...' : targetOptions.length === 0 ? 'No items found' : 'Select Target'}
                </option>
                {targetOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    [{opt.code || '?'}] {opt.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addLinkedEntity}
                disabled={!linkInput.entityId}
                className="px-3 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            </div>

            {/* Linked entity chips */}
            {formData.linkedEntities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.linkedEntities.map((link, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-surface border border-outline-variant rounded-lg font-label-md text-[11px] text-on-surface-variant"
                  >
                    <span className="font-semibold text-primary">{link.entityType.replace('_', ' ')}:</span>
                    {link.entityLabel || `#${link.entityId}`}
                    <button
                      type="button"
                      onClick={() => removeLinkedEntity(idx)}
                      className="ml-1 hover:text-error transition-colors flex items-center"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-low">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-lg font-body-md text-body-md text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg font-body-md text-body-md bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                {isEditMode ? 'Updating...' : 'Uploading...'}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">{isEditMode ? 'save' : 'upload_file'}</span>
                {isEditMode ? 'Update Evidence' : 'Upload Evidence'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvidenceFormModal;
