import React, { useState } from 'react';
import { FiSave, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';

const RequirementInlineEdit = ({ requirement, onSave, onCancel }) => {
  const [editedReq, setEditedReq] = useState({
    title: requirement.title || '',
    description: requirement.description || '',
    priority: requirement.priority || 'Medium',
    type: requirement.type || 'FUNCTIONAL',
    acceptanceCriteria: requirement.acceptanceCriteria || [],
    tags: requirement.tags || [],
  });

  const handleChange = (field, value) => {
    setEditedReq({ ...editedReq, [field]: value });
  };

  const handleAcChange = (index, value) => {
    const newAc = [...editedReq.acceptanceCriteria];
    newAc[index] = value;
    handleChange('acceptanceCriteria', newAc);
  };

  const handleAddAc = () => {
    handleChange('acceptanceCriteria', [...editedReq.acceptanceCriteria, '']);
  };

  const handleRemoveAc = (index) => {
    const newAc = editedReq.acceptanceCriteria.filter((_, i) => i !== index);
    handleChange('acceptanceCriteria', newAc);
  };

  const handleTagChange = (e) => {
    const tagsArray = e.target.value.split(',').map(t => t.trim()).filter(t => t);
    handleChange('tags', tagsArray);
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-[#1E707D]/10/30 p-3 rounded-lg border border-[#1E707D]/20" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-gray-500 uppercase">Title</label>
        <input 
          type="text" 
          value={editedReq.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full h-[32px] px-2 text-[13px] border border-gray-300 rounded focus:ring-1 focus:ring-[#1E707D] focus:outline-none"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-1 w-1/2">
          <label className="text-[11px] font-medium text-gray-500 uppercase">Priority</label>
          <select 
            value={editedReq.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            className="w-full h-[32px] px-2 text-[13px] border border-gray-300 rounded focus:ring-1 focus:ring-[#1E707D] focus:outline-none bg-white"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 w-1/2">
          <label className="text-[11px] font-medium text-gray-500 uppercase">Type</label>
          <select 
            value={editedReq.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full h-[32px] px-2 text-[13px] border border-gray-300 rounded focus:ring-1 focus:ring-[#1E707D] focus:outline-none bg-white"
          >
            <option value="FUNCTIONAL">Functional</option>
            <option value="NON_FUNCTIONAL">Non-Functional</option>
            <option value="BUSINESS">Business</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-gray-500 uppercase">Description</label>
        <textarea 
          value={editedReq.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full p-2 text-[13px] border border-gray-300 rounded focus:ring-1 focus:ring-[#1E707D] focus:outline-none resize-y"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-gray-500 uppercase">Tags (comma separated)</label>
        <input 
          type="text" 
          value={editedReq.tags.join(', ')}
          onChange={handleTagChange}
          placeholder="e.g. Frontend, Auth"
          className="w-full h-[32px] px-2 text-[13px] border border-gray-300 rounded focus:ring-1 focus:ring-[#1E707D] focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <label className="text-[11px] font-medium text-gray-500 uppercase flex justify-between items-center">
          <span>Acceptance Criteria</span>
          <button onClick={handleAddAc} className="text-[#1E707D] hover:underline flex items-center gap-1 text-[11px]">
            <FiPlus size={12} /> Add
          </button>
        </label>
        {editedReq.acceptanceCriteria.map((ac, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <textarea 
              value={ac}
              onChange={(e) => handleAcChange(idx, e.target.value)}
              rows={2}
              className="flex-1 p-2 text-[12px] border border-gray-300 rounded focus:ring-1 focus:ring-[#1E707D] focus:outline-none"
            />
            <button onClick={() => handleRemoveAc(idx)} className="mt-1 p-1.5 text-red-500 hover:bg-red-50 rounded">
              <FiTrash2 size={14} />
            </button>
          </div>
        ))}
        {editedReq.acceptanceCriteria.length === 0 && (
          <p className="text-[12px] text-gray-400 italic">No acceptance criteria defined.</p>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-200">
        <button onClick={onCancel} className="px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-100 rounded">
          Cancel
        </button>
        <button onClick={() => onSave(editedReq)} className="px-3 py-1.5 text-[12px] font-medium bg-[#1E707D] text-white hover:bg-[#155762] rounded flex items-center gap-1">
          <FiSave size={12} /> Save
        </button>
      </div>
    </div>
  );
};

export default RequirementInlineEdit;
