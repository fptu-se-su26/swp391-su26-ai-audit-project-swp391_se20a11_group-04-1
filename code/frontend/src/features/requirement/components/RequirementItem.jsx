import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { requirementApi } from '../services/requirementApi';
import useProjectStore from '../../../store/useProjectStore';
import { getInitials, getAvatarColor } from '../../../utils/avatarHelper';

const RequirementItem = ({ req, onDelete, onEdit, onRefresh }) => {
  const { id, title, type, priority, status, tags, tasksCount = 0, evidenceCount = 0, reqCode } = req;
  const navigate = useNavigate();
  
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  
  const ownerMenuRef = useRef(null);
  const actionMenuRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ownerMenuRef.current && !ownerMenuRef.current.contains(event.target)) {
        setShowOwnerMenu(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeProject = useProjectStore((state) => state.activeProject);
  const projectMembers = activeProject?.members || [];

  const getMemberById = (memberId) => projectMembers.find(m => m.id === memberId);

  // Initialize owner from req.ownerId mapped to project members
  const initialMember = getMemberById(req.ownerId);
  const [currentOwner, setCurrentOwner] = useState(
    initialMember
      ? { initials: initialMember.initials, name: initialMember.name, bg: initialMember.bg }
      : { initials: null, name: null, bg: null }
  );

  // Sync owner state when req.ownerId changes (after parent re-fetches)
  useEffect(() => {
    const member = getMemberById(req.ownerId);
    setCurrentOwner(
      member
        ? { initials: member.initials, name: member.name, bg: member.bg }
        : { initials: null, name: null, bg: null }
    );
  }, [req.ownerId, projectMembers]);

  const handleOwnerSelect = async (e, member) => {
    e.stopPropagation();
    setCurrentOwner({ initials: member.initials, name: member.name, bg: member.bg });
    setShowOwnerMenu(false);
    try {
      const payload = {
        projectId: req.projectId,
        title: req.title,
        description: req.description || '',
        type: req.type || 'FUNCTIONAL',
        priority: req.priority || 'MEDIUM',
        acceptanceCriteria: typeof req.acceptanceCriteria === 'string' ? req.acceptanceCriteria : JSON.stringify(req.acceptanceCriteria || []),
        ownerId: member.id, // ID of the selected project member
        evidenceRequired: req.evidenceRequired || false,
        tags: req.tags || [],
        status: req.status || 'IN_PROGRESS'
      };
      await requirementApi.updateRequirement(req.id, payload);
      // We no longer call onRefresh() here to avoid full page re-render jitter.
      // The state is already updated locally.
    } catch (error) {
      console.error('Lỗi khi cập nhật owner:', error);
      // Revert state if failed
      const prevMember = getMemberById(req.ownerId);
      setCurrentOwner(
        prevMember
          ? { initials: prevMember.initials, name: prevMember.name, bg: prevMember.bg }
          : { initials: null, name: null, bg: null }
      );
    }
  };

  const toggleOwnerMenu = (e) => {
    e.stopPropagation();
    setShowActionMenu(false); // Close other menu
    setShowOwnerMenu(!showOwnerMenu);
  };

  const toggleActionMenu = (e) => {
    e.stopPropagation();
    setShowOwnerMenu(false); // Close other menu
    setShowActionMenu(!showActionMenu);
  };

  const handleAction = (e, actionType) => {
    e.stopPropagation();
    setShowActionMenu(false);
    if (actionType === 'Edit') {
      onEdit(req);
    } else if (actionType === 'Delete') {
      onDelete(req.id);
    }
  };

  return (
    <div onClick={() => navigate(`/projects/${activeProject?.id}/requirements/${id}`)} className="grid grid-cols-12 gap-3 px-stack_md py-3 items-center hover:bg-surface-bright transition-colors group cursor-pointer">
      <div className="col-span-8 sm:col-span-5 md:col-span-4 lg:col-span-4 flex min-w-0 items-center gap-3">
        <span className="font-label-md text-label-md text-primary bg-[#e6f0ff] px-2 py-1 rounded font-bold shrink-0">{reqCode || `REQ-${String(id).padStart(2, '0')}`}</span>
        <div className="min-w-0">
          <span className="block truncate font-body-md text-body-md font-bold text-on-surface">{title}</span>
          <span className="block truncate font-body-md text-sm text-secondary">
            {type === 'FUNCTIONAL' ? 'Functional Requirement' : type === 'NON_FUNCTIONAL' ? 'Non-functional Requirement' : type}
          </span>
        </div>
      </div>
      <div className="col-span-3 sm:col-span-2 hidden sm:flex flex-row flex-wrap gap-1.5 items-center">
        {status && (
          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
            status === 'DRAFT'        ? 'bg-slate-50 text-slate-600 border-slate-200' :
            status === 'IN_PROGRESS'  ? 'bg-amber-50 text-amber-700 border-amber-200' :
            status === 'IN_REVIEW'    ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
            status === 'DONE'         ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            status === 'DEPRECATED'   ? 'bg-rose-50 text-rose-700 border-rose-200' :
            'bg-surface-container text-secondary border-outline-variant'
          }`}>
            {status.replace('_', ' ')}
          </span>
        )}
        {priority && (
          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
            priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
            priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
            priority === 'MEDIUM' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            priority === 'LOW' ? 'bg-slate-50 text-slate-700 border-slate-200' :
            'bg-surface-container text-secondary border-outline-variant'
          }`}>
            {priority} Priority
          </span>
        )}
      </div>
      <div className="col-span-2 hidden lg:flex flex-wrap items-center gap-1">
        {tags?.map(tag => (
          <span key={tag} className="bg-surface border border-outline-variant rounded-md shadow-sm text-xs font-body-md text-secondary px-2 py-0.5">
            {tag}
          </span>
        ))}
      </div>
      <div className="col-span-3 lg:col-span-2 hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-body-md text-secondary">
          <span className="material-symbols-outlined text-[16px]">checklist</span> {tasksCount} Tasks
        </div>
        <div className="flex items-center gap-2 text-xs font-body-md text-secondary">
          <span className="material-symbols-outlined text-[16px]">inventory_2</span> {evidenceCount} Evidence
        </div>
      </div>
      <div className="col-span-4 sm:col-span-2 lg:col-span-2 flex items-center pr-2">
        {/* Owner Section */}
        <div className="flex-1 flex justify-center items-center relative" ref={ownerMenuRef}>
          {currentOwner.initials ? (
            // Owner exists: clickable area to change owner
            <button 
              onClick={toggleOwnerMenu}
              className="flex items-center justify-center hover:bg-surface-container-low p-1 rounded-lg transition-colors"
              title="Change Assignee"
            >
              <div 
                className="w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-[10px] shadow-inner border border-outline-variant/40 shrink-0"
              >
                {getInitials(currentOwner.name)}
              </div>
            </button>
          ) : (
            // No owner: Show + button
            <button 
              onClick={toggleOwnerMenu}
              className="w-6 h-6 rounded-full bg-surface-container hover:bg-surface-container-low text-secondary flex items-center justify-center border border-outline-variant border-dashed transition-colors flex-shrink-0"
              title="Assign Member"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
            </button>
          )}

          {/* Owner Dropdown Menu */}
          {showOwnerMenu && (
            <div className="absolute top-full right-1/2 translate-x-1/2 mt-2 w-48 bg-surface border border-outline-variant rounded-lg shadow-xl py-1 z-[200]">
              <div className="px-3 py-2 text-xs font-label-md text-secondary uppercase border-b border-outline-variant mb-1 text-left">
                Assign to
              </div>
              {projectMembers.length === 0 && (
                <div className="px-3 py-2 text-xs text-secondary italic text-center">
                  No active members in project
                </div>
              )}
              {projectMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={(e) => handleOwnerSelect(e, member)}
                  className="w-full text-left px-3 py-2 hover:bg-surface-container-low flex items-center gap-2 transition-colors"
                >
                  <div 
                    className="w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-[10px] shadow-inner border border-outline-variant/40 shrink-0"
                  >
                    {getInitials(member.name)}
                  </div>
                  <span className="font-body-md text-sm text-on-surface truncate">{member.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Menu Section */}
        <div className="relative w-8 flex justify-end flex-shrink-0" ref={actionMenuRef}>
          <button 
            onClick={toggleActionMenu}
            className="text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>

          {/* Action Dropdown Menu */}
          {showActionMenu && (
            <div className="absolute top-full right-0 mt-1 w-32 bg-surface border border-outline-variant rounded-lg shadow-lg py-1 z-10">
              <button
                onClick={(e) => handleAction(e, 'Edit')}
                className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit
              </button>
              <button
                onClick={(e) => handleAction(e, 'Delete')}
                className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-container hover:text-on-error-container flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequirementItem;
