import React from 'react';

const RequirementDetailDescription = ({ requirement }) => {
  if (!requirement) return null;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack_lg">
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4 border-b border-surface-container-highest pb-2">Description</h3>
      {requirement.description ? (
        <div 
          className="prose prose-sm max-w-none font-body-md text-body-md text-on-surface-variant"
          dangerouslySetInnerHTML={{ __html: requirement.description }}
        />
      ) : (
        <div className="text-secondary italic text-sm">Chưa có mô tả chi tiết.</div>
      )}
    </div>
  );
};

export default RequirementDetailDescription;
