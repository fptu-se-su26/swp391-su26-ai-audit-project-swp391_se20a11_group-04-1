import React from 'react';

const RequirementFormProperties = ({ formData, onChange }) => {
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!formData.tags.includes(newTag)) {
        onChange('tags', [...formData.tags, newTag]);
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    onChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-stack_lg flex flex-col gap-stack_lg">
      {/* Type Dropdown */}
      <div className="flex flex-col gap-1">
        <label className="font-label-md text-label-md text-on-surface-variant uppercase">Type</label>
        <div className="relative">
          <select 
            className="w-full appearance-none px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-[#1E707D] focus:ring-2 focus:ring-[#1E707D]-fixed-dim transition-all cursor-pointer"
            value={formData.type}
            onChange={(e) => onChange('type', e.target.value)}
          >
            <option value="FUNCTIONAL">Functional</option>
            <option value="NON_FUNCTIONAL">Non-Functional</option>
            <option value="BUSINESS_RULE">Business Rule</option>
            <option value="SECURITY">Security</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
        </div>
      </div>

      {/* Priority Dropdown */}
      <div className="flex flex-col gap-1">
        <label className="font-label-md text-label-md text-on-surface-variant uppercase">Priority</label>
        <div className="relative">
          <select 
            className="w-full appearance-none px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-[#1E707D] focus:ring-2 focus:ring-[#1E707D]-fixed-dim transition-all cursor-pointer" 
            value={formData.priority}
            onChange={(e) => onChange('priority', e.target.value)}
          >
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
        </div>
      </div>

      {/* Tags Input */}
      <div className="flex flex-col gap-2">
        <label className="font-label-md text-label-md text-on-surface-variant uppercase">Tags (Nhấn Enter để thêm)</label>
        <div className="flex flex-wrap gap-2 mb-1">
          {formData.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1E707D]/10 text-[#1E707D] font-label-md text-label-md">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-error"><span className="material-symbols-outlined text-[14px]">close</span></button>
            </span>
          ))}
        </div>
        <div className="relative">
          <input 
            className="w-full px-4 py-2 bg-surface-bright border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-[#1E707D] focus:ring-2 focus:ring-[#1E707D]-fixed-dim transition-all" 
            placeholder="Add tag and press Enter..." 
            type="text" 
            onKeyDown={handleTagKeyDown}
          />
        </div>
      </div>

    </div>
  );
};

export default RequirementFormProperties;
