import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AiUploadModal from './AiUploadModal';
import Button from '../../../components/ui/Button';

const RequirementHeader = ({ onOpenCreateModal, isLeader, children }) => {
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
      <div className="flex flex-wrap items-center gap-3">
          {children}
          <button 
            type="button"
            onClick={() => isLeader && setIsAiModalOpen(true)}
            disabled={!isLeader}
            title={!isLeader ? "Only Project Leader can use AI Import" : ""}
            className={`h-[44px] px-5 bg-secondary-container text-on-secondary-container rounded-xl font-bold flex items-center justify-center transition-colors text-[14px] shadow-sm ${!isLeader ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary-fixed'}`}
          >
            AI Import
          </button>
          <Button 
            variant="primary"
            onClick={() => isLeader && onOpenCreateModal()}
            disabled={!isLeader}
            className={!isLeader ? 'opacity-50 cursor-not-allowed' : ''}
            title={!isLeader ? "Only Project Leader can add requirements" : ""}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Requirement
          </Button>
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
