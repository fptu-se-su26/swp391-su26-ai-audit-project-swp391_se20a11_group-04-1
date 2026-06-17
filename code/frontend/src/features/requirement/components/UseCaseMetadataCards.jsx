import React from 'react';

const UseCaseMetadataCards = ({ useCase, isEditing, onFieldChange }) => {
  const actorsText = useCase.actors ? useCase.actors.join(', ') : '';

  const handleActorsChange = (e) => {
    const value = e.target.value;
    const actors = value.split(',').map(a => a.trim()).filter(a => a);
    onFieldChange('actors', actors);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-stack_lg">
      {/* Linked Requirement */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack_md flex items-center gap-4 hover:shadow-sm transition-shadow">
        <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
          <span className="material-symbols-outlined">description</span>
        </div>
        <div>
          <p className="font-label-md text-label-md text-secondary uppercase mb-1">Linked Requirement</p>
          <a className="font-body-lg text-body-lg text-primary hover:underline font-semibold flex items-center gap-1" href="#">
            {useCase.reqCode || `REQ-${useCase.requirementId}`} <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
        </div>
      </div>
      
      {/* Actor */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack_md flex items-center gap-4 hover:shadow-sm transition-shadow">
        <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container shrink-0">
          <span className="material-symbols-outlined">person</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-label-md text-label-md text-secondary uppercase mb-1">Primary Actor</p>
          {isEditing ? (
            <input
              type="text"
              value={actorsText}
              onChange={handleActorsChange}
              placeholder="Admin, Student"
              className="w-full px-2 py-1 font-body-lg text-body-lg text-on-surface font-semibold border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          ) : (
            <p className="font-body-lg text-body-lg text-on-surface font-semibold truncate">
              {useCase.actors && useCase.actors.length > 0 ? useCase.actors.join(', ') : 'None'}
            </p>
          )}
        </div>
      </div>
      
      {/* AI Confidence */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack_md flex items-center gap-4 hover:shadow-sm transition-shadow">
        <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
          <span className="material-symbols-outlined">bolt</span>
        </div>
        <div className="w-full">
          <p className="font-label-md text-label-md text-secondary uppercase mb-1">Completeness Score</p>
          <div className="flex items-center gap-2">
            <div className="w-full h-2 bg-surface-container-highest rounded-full max-w-[96px]">
              <div 
                className={`h-full rounded-full ${useCase.completenessScore < 50 ? 'bg-error' : 'bg-primary'}`} 
                style={{ width: `${useCase.completenessScore || 0}%` }}>
              </div>
            </div>
            <span className="font-body-md text-body-md text-on-surface font-semibold">{useCase.completenessScore || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UseCaseMetadataCards;
