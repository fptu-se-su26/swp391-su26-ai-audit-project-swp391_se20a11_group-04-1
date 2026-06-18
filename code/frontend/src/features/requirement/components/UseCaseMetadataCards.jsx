import React from 'react';
import { useParams, Link } from 'react-router-dom';

const UseCaseMetadataCards = ({ useCase, isEditing, onFieldChange }) => {
  const { projectId } = useParams();
  const [inputValue, setInputValue] = React.useState('');

  const handleAddActor = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = inputValue.trim();
      if (val) {
        const newActors = [...(useCase.actors || []), val];
        onFieldChange('actors', newActors);
        setInputValue('');
      }
    }
  };

  const handleRemoveActor = (indexToRemove) => {
    const newActors = (useCase.actors || []).filter((_, i) => i !== indexToRemove);
    onFieldChange('actors', newActors);
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
          <Link to={`/projects/${projectId}/requirements/${useCase.requirementId}`} className="font-body-lg text-body-lg text-primary hover:underline font-semibold flex items-center gap-1">
            {useCase.reqCode || `REQ-${useCase.requirementId}`} <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </Link>
        </div>
      </div>
      
      {/* Actor */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack_md flex items-center gap-4 hover:shadow-sm transition-shadow">
        <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container shrink-0">
          <span className="material-symbols-outlined">person</span>
        </div>
          <div className="flex-1 min-w-0">
            <p className="font-label-md text-label-md text-secondary uppercase mb-1">Actors</p>
            {isEditing ? (
              <div className="w-full flex flex-wrap gap-1 p-1 border border-outline-variant rounded-lg bg-surface-container-lowest focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                {(useCase.actors || []).map((actor, idx) => (
                  <span key={idx} className="flex items-center gap-1 bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-sm">
                    {actor}
                    <button 
                      onClick={() => handleRemoveActor(idx)}
                      className="text-on-secondary-container hover:text-error rounded-full"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleAddActor}
                  onBlur={() => {
                    const val = inputValue.trim();
                    if (val) {
                      onFieldChange('actors', [...(useCase.actors || []), val]);
                      setInputValue('');
                    }
                  }}
                  placeholder="Type & press Enter"
                  className="flex-1 min-w-[100px] px-1 py-1 font-body-sm text-body-sm text-on-surface bg-transparent border-none outline-none"
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-1 mt-1">
                {useCase.actors && useCase.actors.length > 0 ? (
                  useCase.actors.map((actor, idx) => (
                    <span key={idx} className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-sm">
                      {actor}
                    </span>
                  ))
                ) : (
                  <span className="font-body-lg text-body-lg text-on-surface font-semibold truncate">None</span>
                )}
              </div>
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
