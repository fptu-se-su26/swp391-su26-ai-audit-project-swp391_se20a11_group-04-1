import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const RequirementFormDetails = ({ formData, onChange }) => {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
      <div className="px-stack_lg py-stack_md border-b border-surface-container-high">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Requirement Details</h2>
      </div>
      <div className="p-stack_lg flex flex-col gap-stack_lg">
        {/* Title Input */}
        <div className="flex flex-col gap-1">
          <label className="font-label-md text-label-md text-on-surface-variant uppercase">Requirement Title <span className="text-error">*</span></label>
          <input 
            className="w-full px-4 py-3 bg-surface-bright border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all" 
            placeholder="e.g., User Authentication via SSO" 
            type="text" 
            value={formData.title}
            onChange={(e) => onChange('title', e.target.value)}
          />
        </div>
        {/* Rich Text Description */}
        <div className="flex flex-col gap-1">
          <label className="font-label-md text-label-md text-on-surface-variant uppercase">Description</label>
          <div className="border border-outline-variant rounded-lg overflow-hidden flex flex-col [&_.ql-toolbar]:bg-surface-container-low [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-outline-variant [&_.ql-container]:border-none [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:font-body-md [&_.ql-editor]:text-body-md [&_.ql-editor]:text-on-surface [&_.ql-editor.ql-blank::before]:text-outline">
            <ReactQuill 
              theme="snow"
              value={formData.description}
              onChange={(content) => onChange('description', content)}
              placeholder="Describe the requirement in detail..."
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['link', 'image'],
                  ['clean']
                ]
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementFormDetails;
