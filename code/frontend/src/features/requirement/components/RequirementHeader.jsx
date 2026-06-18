import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AiUploadModal from './AiUploadModal';

const RequirementHeader = ({ onOpenCreateModal }) => {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const navigate = useNavigate();
  const { projectId } = useParams();
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-stack_lg">
      <div>
        <h2 className="font-display-lg text-display-lg text-on-surface mb-1">Requirements</h2>
        <p className="font-body-md text-body-md text-secondary">Manage and track system requirements and coverage.</p>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsAiModalOpen(true)}
          className="flex items-center gap-2 bg-surface-container-lowest text-on-surface border border-outline-variant h-[44px] px-4 rounded-lg font-body-md text-body-md hover:bg-surface-container-low transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          AI Import
        </button>
        <button 
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 bg-primary text-on-primary h-[44px] px-4 rounded-lg font-body-md text-body-md hover:bg-on-primary-fixed-variant transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Requirement
        </button>
      </div>
    </div>
      
      {/* AI Upload Modal */}
      <AiUploadModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        onSuccess={(generationId) => {
          setIsAiModalOpen(false);
          // Redirect to the staging review screen
          navigate(`/projects/${projectId}/requirements/staging`);
        }}
      />
    </>
  );
};

export default RequirementHeader;
