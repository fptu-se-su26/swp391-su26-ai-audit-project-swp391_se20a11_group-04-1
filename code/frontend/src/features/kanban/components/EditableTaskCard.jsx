import React, { useState } from 'react';

const EditableTaskCard = ({
  task,
  sprints = [],
  members = [],
  priorityColor,
  getTypeConfig,
  onSave,
  isMergingToExisting = false,
  readOnlyMode = false, // When true, doesn't allow editing (for the top half of modals)
  onEditStateChange // Callback to notify parent if card is currently being edited
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStartEdit = () => {
    if (readOnlyMode) return;
    setEditForm({ ...task });
    setIsEditing(true);
    if (onEditStateChange) onEditStateChange(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
    if (onEditStateChange) onEditStateChange(false);
  };

  const handleSaveEdit = () => {
    if (onSave) {
      onSave({ ...task, ...editForm });
    }
    setIsEditing(false);
    if (onEditStateChange) onEditStateChange(false);
  };

  const handleQuickAssigneeChange = (e) => {
    if (readOnlyMode) return;
    if (onSave) {
      onSave({
        ...task,
        suggested_assignee: {
          ...(task.suggested_assignee || {}),
          member_name: e.target.value
        }
      });
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-3">
        <input 
          className="w-full border border-slate-300 rounded p-2 text-base font-bold outline-none focus:border-indigo-500"
          value={editForm.title || ''}
          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
          placeholder="Task Title"
        />
        <textarea 
          className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-indigo-500"
          rows={3}
          value={editForm.description || ''}
          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
          placeholder="Task Description"
        />
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded border border-slate-100">
          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Giờ:</span>
              <input 
                type="number"
                className="border border-slate-300 rounded px-2 py-1 text-sm w-16 outline-none focus:border-indigo-500"
                value={editForm.estimated_hours || ''}
                onChange={(e) => setEditForm({...editForm, estimated_hours: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Weight:</span>
              <input 
                type="number"
                step="0.1"
                min="1.0"
                max="2.0"
                className="border border-slate-300 rounded px-2 py-1 text-sm w-16 outline-none focus:border-indigo-500"
                value={editForm.weight || ''}
                onChange={(e) => setEditForm({...editForm, weight: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Ưu tiên:</span>
              <select 
                className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500"
                value={editForm.priority || ''}
                onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Loại:</span>
              <select 
                className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500"
                value={editForm.task_type || ''}
                onChange={(e) => setEditForm({...editForm, task_type: e.target.value})}
              >
                <option value="DEVELOPMENT">Development</option>
                <option value="TESTING">Testing</option>
                <option value="DOCUMENTATION">Documentation</option>
                <option value="UI_UX">UI/UX</option>
                <option value="RESEARCH">Research</option>
                <option value="DEPLOYMENT">Deployment</option>
                <option value="BUG_FIX">Bug Fix</option>
                <option value="REVIEW">Review</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Bắt đầu:</span>
              <input 
                type="date"
                className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500"
                value={editForm.start_date || ''}
                onChange={(e) => setEditForm({...editForm, start_date: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Deadline:</span>
              <input 
                type="date"
                className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500"
                value={editForm.deadline || editForm.suggested_deadline || ''}
                onChange={(e) => setEditForm({...editForm, deadline: e.target.value, suggested_deadline: e.target.value})}
              />
            </div>
          </div>
          {sprints.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Sprint:</span>
              <select 
                className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500"
                value={editForm.sprint_id || ''}
                onChange={(e) => setEditForm({...editForm, sprint_id: e.target.value})}
              >
                <option value="">-- No Sprint --</option>
                {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Người làm:</span>
              <select 
                className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500 max-w-[200px]"
                value={editForm.suggested_assignee?.member_name || ''}
                onChange={(e) => setEditForm({
                  ...editForm, 
                  suggested_assignee: { 
                    ...editForm.suggested_assignee, 
                    member_name: e.target.value 
                  }
                })}
              >
                <option value="">-- Chưa gán --</option>
                {members.map(m => {
                  const username = m.user?.username || m.username || m.name;
                  const displayName = m.user?.fullName || m.fullName || m.name || username;
                  return <option key={m.userId || m.id || username} value={username}>{displayName}</option>
                })}
              </select>
            </div>
          <div className="ml-auto flex gap-2">
            <button onClick={handleCancelEdit} className="px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors">
              ✕ Hủy
            </button>
            <button onClick={handleSaveEdit} className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors">
              ✓ Lưu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Read-only Content */}
      <div className="flex justify-between items-start gap-4">
        <h4 className="font-bold text-slate-800 text-lg leading-snug">
          {task.title}
        </h4>
        {!readOnlyMode && (
          <button 
            onClick={handleStartEdit}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
            title="Edit Task"
          >
            ✏️
          </button>
        )}
      </div>

      {/* ROW 2: Description */}
      <div className="mt-2 text-sm text-slate-600">
        <p className={isExpanded ? "" : "line-clamp-2"}>
          {task.description}
        </p>
        {(task.description?.length > 120) && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-indigo-600 hover:underline text-xs font-medium mt-1 inline-flex items-center"
          >
            {isExpanded ? "thu gọn ▴" : "xem thêm ▾"}
          </button>
        )}
      </div>

      {/* ROW 3: Badges */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold tracking-wider ${priorityColor(task.priority)}`}>
          {task.priority}
        </span>

        {task.task_type && (
          <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border ${getTypeConfig(task.task_type).color}`}>
            {getTypeConfig(task.task_type).label}
          </span>
        )}
        
        <span className="text-[12px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border border-slate-200">
          {task.estimated_hours}h
        </span>

        {task.weight && (
          <span className="text-[12px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border border-amber-200" title="Cognitive Complexity Weight">
            Weight: {task.weight}
          </span>
        )}

        {(task.start_date || task.deadline || task.suggested_deadline) && (
          <span className="text-[12px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border border-indigo-200" title="Timeline">
            {task.start_date || '?'} → {task.deadline || task.suggested_deadline || '?'}
          </span>
        )}

        {isMergingToExisting && (
          <span className="text-[12px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium border border-teal-200">
            Merge to {task._existingTaskId}
          </span>
        )}
      </div>

      {/* ROW 4: References & Assignee */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-500">Requirement:</span>
          <span className="text-indigo-600 font-medium">{task.requirement_code || 'N/A'}</span>
        </div>
        <div className="w-px h-3 bg-slate-300"></div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-500">Use Case:</span>
          <span className="text-indigo-600 font-medium">{task.use_case_code || 'N/A'}</span>
        </div>
        <div className="w-px h-3 bg-slate-300"></div>
          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            <span className="font-semibold text-slate-500">Assignee:</span>
            <select 
              className="text-slate-800 font-medium bg-transparent border-b border-dashed border-slate-300 outline-none hover:bg-slate-50 cursor-pointer max-w-[150px] truncate"
              value={task.suggested_assignee?.member_name || ''}
              onChange={handleQuickAssigneeChange}
              disabled={readOnlyMode}
            >
              <option value="">-- Chưa gán --</option>
              {members.map(m => {
                const username = m.user?.username || m.username || m.name;
                const displayName = m.user?.fullName || m.fullName || m.name || username;
                return <option key={m.userId || m.id || username} value={username}>{displayName}</option>
              })}
            </select>
          </div>
        
        {task.sprint_id && sprints.find(s => s.id == task.sprint_id) && (
          <>
            <div className="w-px h-3 bg-slate-300"></div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Sprint:</span>
              <span className="text-indigo-600 font-medium">{sprints.find(s => s.id == task.sprint_id).name}</span>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default EditableTaskCard;
