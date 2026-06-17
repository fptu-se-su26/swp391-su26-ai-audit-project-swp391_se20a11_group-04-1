import React from 'react';

const UseCaseDetailHeader = ({ useCase, isEditing, saving, updatingStatus, onEdit, onSave, onCancel, onFieldChange, onStatusChange }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-[#e6f4ea] text-[#137333]';
      case 'IN_REVIEW': return 'bg-[#fef7e0] text-[#b06000]';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-surface-variant text-on-surface-variant';
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-stack_lg mb-stack_lg pb-stack_md border-b border-outline-variant">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-stack_sm mb-2 flex-wrap">
          {isEditing ? (
            <>
              <select
                value={useCase.status || 'DRAFT'}
                onChange={(e) => onFieldChange('status', e.target.value)}
                className="px-2 py-0.5 font-label-md text-label-md rounded-DEFAULT uppercase tracking-wider border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer transition-all"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="IN_REVIEW">IN_REVIEW</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
              <input
                type="text"
                value={useCase.version || ''}
                onChange={(e) => onFieldChange('version', e.target.value)}
                className="w-20 px-2 py-0.5 text-secondary font-label-md text-label-md border border-outline-variant rounded-DEFAULT bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="v1.0"
              />
            </>
          ) : (
            <>
              <select
                value={useCase.status || 'DRAFT'}
                onChange={(e) => onStatusChange(e.target.value)}
                disabled={updatingStatus}
                className={`px-2 py-0.5 font-label-md text-label-md rounded-DEFAULT uppercase tracking-wider outline-none cursor-pointer transition-all border-none ${getStatusColor(useCase.status)} appearance-none hover:opacity-80 disabled:opacity-50 text-center`}
              >
                <option value="DRAFT" className="bg-white text-on-surface">DRAFT</option>
                <option value="IN_PROGRESS" className="bg-white text-on-surface">IN_PROGRESS</option>
                <option value="IN_REVIEW" className="bg-white text-on-surface">IN_REVIEW</option>
                <option value="APPROVED" className="bg-white text-on-surface">APPROVED</option>
                <option value="REJECTED" className="bg-white text-on-surface">REJECTED</option>
              </select>
              <span className="text-secondary font-label-md text-label-md">{useCase.version || 'v1.0'}</span>
            </>
          )}
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <span className="font-display-lg text-display-lg text-on-surface-variant">{useCase.code}:</span>
            <input
              type="text"
              value={useCase.name || ''}
              onChange={(e) => onFieldChange('name', e.target.value)}
              className="flex-1 font-display-lg text-display-lg text-on-surface border-b-2 border-primary bg-transparent outline-none pb-1 transition-all"
              placeholder="Use Case Name"
            />
          </div>
        ) : (
          <h1 className="font-display-lg text-display-lg text-on-surface mb-2">{useCase.code}: {useCase.name}</h1>
        )}
      </div>

      <div className="flex gap-stack_sm shrink-0">
        {isEditing ? (
          <>
            <button 
              onClick={onCancel}
              disabled={saving}
              className="h-11 px-4 bg-surface-container-highest text-on-surface hover:bg-surface-container-high transition-colors rounded-DEFAULT font-label-md text-label-md flex items-center gap-2 border border-outline-variant disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">close</span> Cancel
            </button>
            <button 
              onClick={onSave}
              disabled={saving}
              className="h-11 px-5 bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors rounded-DEFAULT font-label-md text-label-md flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span> Save Changes
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={onEdit}
              className="h-11 px-4 bg-surface-container-highest text-on-surface hover:bg-surface-container-high transition-colors rounded-DEFAULT font-label-md text-label-md flex items-center gap-2 border border-outline-variant"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span> Edit
            </button>
            <button className="h-11 px-5 bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors rounded-DEFAULT font-label-md text-label-md flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span> Suggest Test Cases
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UseCaseDetailHeader;
