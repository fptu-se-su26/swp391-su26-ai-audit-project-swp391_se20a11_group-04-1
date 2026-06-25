import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AiUploadModal from './AiUploadModal';
import Button from '../../../components/ui/Button';

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
        <Button 
          variant="outline"
          onClick={() => setIsAiModalOpen(true)}
        >
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          AI Import
        </Button>
        <Button 
          variant="primary"
          onClick={onOpenCreateModal}
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
