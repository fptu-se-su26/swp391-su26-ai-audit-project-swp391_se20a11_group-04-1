import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const EditableTaskCard = ({
  task,
  sprints = [],
  members = [],
  priorityColor,
  getTypeConfig,
  onUpdate,
  onChangeSprint,
  isMergingToExisting = false,
  readOnlyMode = false, // When true, doesn't allow editing (for the top half of modals)
  onEditStateChange, // Callback to notify parent if card is currently being edited
  maxAllowedDate // Add this to limit max deadline (from project or requirement)
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);

  const checkSprintDateError = (formState) => {
    if (!formState.sprint_id) return null;
    const selectedSprint = sprints.find(s => String(s.id) === String(formState.sprint_id));
    if (!selectedSprint) return null;
    const sStart = selectedSprint.startDate || selectedSprint.start_date;
    const sEnd = selectedSprint.endDate || selectedSprint.end_date;
    if (!sStart || !sEnd) return null;
    
    const tStart = formState.start_date || formState.startDate;
    const tEnd = formState.deadline || formState.suggested_deadline || formState.endDate;
    
    if (tStart && tStart < sStart) return `Bắt đầu trước Sprint (${sStart})`;
    if (tEnd && tEnd > sEnd) return `Kết thúc sau Sprint (${sEnd})`;
    return null;
  };

  const todayDateStr = new Date().toISOString().split('T')[0];
  let sprintMin = todayDateStr;
  let sprintMax = maxAllowedDate || '';
  const currentSprintId = isEditing ? (editForm.sprint_id || task.sprint_id || task.sprintId) : (task.sprint_id || task.sprintId);
  if (currentSprintId) {
    const selectedSprint = sprints.find(s => String(s.id) === String(currentSprintId));
    if (selectedSprint) {
      const sStart = selectedSprint.startDate || selectedSprint.start_date;
      const sEnd = selectedSprint.endDate || selectedSprint.end_date;
      if (sStart && sStart > sprintMin) sprintMin = sStart;
      if (sEnd) sprintMax = sEnd;
    }
  }

  const isSprintValid = (sprintId, tStart, tEnd) => {
    if (!sprintId) return true;
    const s = sprints.find(sp => String(sp.id) === String(sprintId));
    if (!s) return true;
    const sStart = s.startDate || s.start_date;
    const sEnd = s.endDate || s.end_date;
    if (!sStart || !sEnd) return true;
    if (tStart && tStart < sStart) return false;
    if (tEnd && tEnd > sEnd) return false;
    return true;
  };

  const sprintError = checkSprintDateError(isEditing ? editForm : task);

  const handleStartEdit = () => {
    if (readOnlyMode) return;
    setEditForm({ 
      ...task, 
      checklists: Array.isArray(task.checklists) ? [...task.checklists] : [] 
    });
    setIsEditing(true);
    if (onEditStateChange) onEditStateChange(true);
  };

  const handleChecklistChange = (index, value) => {
    const newChecklists = [...(editForm.checklists || [])];
    newChecklists[index] = value;
    setEditForm({ ...editForm, checklists: newChecklists });
  };

  const handleRemoveChecklist = (index) => {
    const newChecklists = (editForm.checklists || []).filter((_, i) => i !== index);
    setEditForm({ ...editForm, checklists: newChecklists });
  };

  const handleAddChecklist = () => {
    const newChecklists = [...(editForm.checklists || []), ""];
    setEditForm({ ...editForm, checklists: newChecklists });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
    if (onEditStateChange) onEditStateChange(false);
  };

  const handleSaveEdit = () => {
    if (editForm.estimated_hours !== undefined && editForm.estimated_hours !== '') {
      const hours = Number(editForm.estimated_hours);
      if (isNaN(hours) || hours <= 0 || hours > 999) {
        toast.error('Số giờ ước tính phải lớn hơn 0 và nhỏ hơn 1000!');
        return;
      }
    }

    const tStart = editForm.start_date || task.start_date;
    const tEnd = editForm.deadline || editForm.suggested_deadline || task.deadline || task.suggested_deadline;
    
    if (tStart && tEnd && tStart > tEnd) {
      toast.error('Ngày bắt đầu không được lớn hơn Deadline!');
      return;
    }
    
    const sprintErr = checkSprintDateError({ ...task, ...editForm });
    if (sprintErr) {
      toast.error('Ngày tháng không hợp lệ với Sprint: ' + sprintErr);
      return;
    }

    if (onUpdate) {
      onUpdate({ ...task, ...editForm });
    }
    setIsEditing(false);
    if (onEditStateChange) onEditStateChange(false);
  };

  const handleQuickAssigneeChange = (e) => {
    if (readOnlyMode) return;
    if (onUpdate) {
      onUpdate({
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
                min="0.1"
                max="999"
                step="0.1"
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
                min={sprintMin}
                max={editForm.deadline || editForm.suggested_deadline || sprintMax || undefined}
                onChange={(e) => setEditForm({...editForm, start_date: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Deadline:</span>
              <input 
                type="date"
                className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500"
                value={editForm.deadline || editForm.suggested_deadline || ''}
                min={editForm.start_date || sprintMin}
                max={sprintMax || undefined}
                onChange={(e) => setEditForm({...editForm, deadline: e.target.value, suggested_deadline: e.target.value})}
              />
            </div>
          </div>
          {sprints.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Sprint:</span>
                <select 
                  className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500"
                  value={editForm.sprint_id || ''}
                  onChange={(e) => setEditForm({...editForm, sprint_id: e.target.value})}
                >
                  <option value="">-- No Sprint --</option>
                  {sprints.map(s => {
                    const valid = isSprintValid(s.id, editForm.start_date, editForm.deadline || editForm.suggested_deadline);
                    return (
                      <option key={s.id} value={s.id} disabled={!valid}>
                        {s.name} {!valid ? '(Sai ngày)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
              {sprintError && (
                <span className="text-[11px] text-red-500 font-medium italic mt-0.5">{sprintError}</span>
              )}
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
            
          {/* Checklist Edit Section */}
          <div className="w-full mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Checklist ({(editForm.checklists || []).length})</span>
            </div>
            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
              {(editForm.checklists || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-300 text-[20px]">check_box_outline_blank</span>
                  <input
                    type="text"
                    className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500"
                    value={item}
                    onChange={(e) => handleChecklistChange(idx, e.target.value)}
                    placeholder="Nhập tiêu chí hoàn thành..."
                  />
                  <button 
                    onClick={() => handleRemoveChecklist(idx)}
                    className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors shrink-0"
                    title="Xóa tiêu chí"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
              <button 
                onClick={handleAddChecklist}
                className="self-start mt-1 px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors flex items-center gap-1 shrink-0"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                Thêm tiêu chí
              </button>
            </div>
          </div>

          <div className="ml-auto flex gap-2 w-full justify-end mt-2 pt-3 border-t border-slate-200">
            <button onClick={handleCancelEdit} className="px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors">
              ✕ Hủy
            </button>
            <button 
              onClick={handleSaveEdit} 
              disabled={!!sprintError}
              className={`px-3 py-1 text-sm font-medium text-white rounded transition-colors ${
                sprintError ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
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
        <h4 className="font-bold text-slate-800 text-lg leading-snug flex items-center gap-2">
          {task.title}
          {task.temp_id && (
            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">
              #{task.temp_id}
            </span>
          )}
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

      {/* ROW 2.5: Checklists (View Mode) */}
      {task.checklists && task.checklists.length > 0 && (
        <div className="mt-3 bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">checklist</span>
              Checklist
            </span>
            <span className="text-[11px] font-medium text-slate-500">0/{task.checklists.length}</span>
          </div>
          <div className="p-2 flex flex-col gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
            {task.checklists.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 group">
                <span className="material-symbols-outlined text-slate-300 text-[18px] mt-0.5 group-hover:text-indigo-300 transition-colors cursor-default">check_box_outline_blank</span>
                <span className="text-[13px] text-slate-700 leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div className="flex flex-col gap-0.5" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Sprint:</span>
            {readOnlyMode || !onChangeSprint ? (
              <span className="text-indigo-600 font-medium">
                {task.sprint_id && sprints ? sprints.find(s => String(s.id) === String(task.sprint_id))?.name || `Sprint ${task.sprint_id}` : 'N/A'}
              </span>
            ) : (
              <select
                value={task.sprint_id || ''}
                onChange={(e) => onChangeSprint(e.target.value)}
                className="text-indigo-600 font-medium bg-transparent border-b border-dashed border-indigo-300 outline-none hover:bg-slate-50 cursor-pointer max-w-[150px] truncate"
              >
                <option value="">-- Chưa gán --</option>
                {sprints.map(s => {
                  const valid = isSprintValid(s.id, task.start_date || task.startDate, task.deadline || task.suggested_deadline || task.endDate);
                  return (
                    <option key={s.id} value={s.id} disabled={!valid}>
                      {s.name} {!valid ? '(Sai ngày)' : ''}
                    </option>
                  )
                })}
              </select>
            )}
          </div>
          {sprintError && (
            <span className="text-[11px] text-red-500 font-medium italic">{sprintError}</span>
          )}
        </div>
        <div className="w-px h-3 bg-slate-300"></div>
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
        
      </div>
      
      {task.depends_on && Array.isArray(task.depends_on) && task.depends_on.length > 0 && (
        <div className="mt-2 text-[12px] text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">link</span>
          <span className="font-semibold">Phụ thuộc vào:</span> {task.depends_on.join(', ')} (Cần làm xong trước khi bắt đầu)
        </div>
      )}
    </>
  );
};

export default EditableTaskCard;
