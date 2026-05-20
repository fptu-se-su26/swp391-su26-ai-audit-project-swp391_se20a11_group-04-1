import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { requirementApi } from '../services/requirementApi';
import { MEMBERS, getMemberById } from '../constants/members';

const RequirementItem = ({ req, onDelete, onEdit, onRefresh }) => {
  const { id, title, type, priority, status, tags, tasksCount = 0, evidenceCount = 0, progress = 0, ownerInitials, ownerName, isOwnerPrimary = false } = req;
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

  // Initialize owner from req.ownerId mapped to shared MEMBERS list
  const initialMember = getMemberById(req.ownerId);
  const [currentOwner, setCurrentOwner] = useState(
    initialMember
      ? { initials: initialMember.initials, name: initialMember.name, isPrimary: initialMember.isPrimary }
      : { initials: null, name: null, isPrimary: false }
  );

  // Sync owner state when req.ownerId changes (after parent re-fetches)
  useEffect(() => {
    const member = getMemberById(req.ownerId);
    setCurrentOwner(
      member
        ? { initials: member.initials, name: member.name, isPrimary: member.isPrimary }
        : { initials: null, name: null, isPrimary: false }
    );
  }, [req.ownerId]);

  const handleOwnerSelect = async (e, member) => {
    e.stopPropagation();
    setCurrentOwner({ initials: member.initials, name: member.name, isPrimary: member.isPrimary });
    setShowOwnerMenu(false);
    try {
      const payload = {
        projectId: req.projectId || 1,
        title: req.title,
        description: req.description || '',
        type: req.type || 'FUNCTIONAL',
        priority: req.priority || 'MEDIUM',
        acceptanceCriteria: typeof req.acceptanceCriteria === 'string' ? req.acceptanceCriteria : JSON.stringify(req.acceptanceCriteria || []),
        ownerId: member.id, // Guarantee this is a number 1-4
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
          ? { initials: prevMember.initials, name: prevMember.name, isPrimary: prevMember.isPrimary }
          : { initials: null, name: null, isPrimary: false }
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
    <div onClick={() => navigate(`/requirements/${id}`)} className="grid grid-cols-12 gap-4 px-stack_md py-4 items-center hover:bg-surface-bright transition-colors group cursor-pointer last:rounded-b-xl">
      <div className="col-span-8 sm:col-span-5 md:col-span-4 lg:col-span-4 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-label-md text-label-md text-primary bg-[#e6f0ff] px-2 py-1 rounded font-bold">REQ-{String(id).padStart(2, '0')}</span>
          <span className="font-body-md text-body-md font-bold text-on-surface">{title}</span>
        </div>
        <span className="font-body-md text-body-md text-secondary text-sm">
          {type === 'FUNCTIONAL' ? 'Functional Requirement' : type === 'NON_FUNCTIONAL' ? 'Non-functional Requirement' : type}
        </span>
      </div>
      <div className="col-span-3 sm:col-span-2 hidden sm:flex flex-col gap-1.5 justify-center">
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
      <div className="col-span-2 hidden lg:flex flex-wrap gap-1">
        {tags?.map(tag => (
          <span key={tag} className="bg-surface border border-outline-variant rounded-md shadow-sm text-xs font-body-md text-secondary px-2.5 py-1">
            {tag}
          </span>
        ))}
      </div>
      <div className="col-span-3 lg:col-span-2 hidden md:flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-body-md text-secondary">
          <span className="material-symbols-outlined text-[16px]">checklist</span> {tasksCount} Tasks
        </div>
        <div className="flex items-center gap-2 text-xs font-body-md text-secondary">
          <span className="material-symbols-outlined text-[16px]">inventory_2</span> {evidenceCount} Evidence
        </div>
        <div className="w-full max-w-[120px] bg-surface-container-high rounded-full h-1.5 mt-1">
          <div className={`${progress > 0 ? 'bg-[#1e40af]' : 'bg-outline-variant'} h-1.5 rounded-full`} style={{ width: `${progress > 0 ? progress : 0}%` }}></div>
        </div>
      </div>
      <div className="col-span-4 sm:col-span-2 lg:col-span-2 flex items-center pr-2">
        {/* Owner Section */}
        <div className="flex-1 flex justify-center items-center relative" ref={ownerMenuRef}>
          {currentOwner.initials ? (
            // Owner exists: clickable area to change owner
            <button 
              onClick={toggleOwnerMenu}
              className="flex items-center justify-center gap-2 hover:bg-surface-container-low p-1 rounded-lg transition-colors text-left"
              title="Change Assignee"
            >
              <div className={`w-6 h-6 rounded-full ${currentOwner.isPrimary ? 'bg-[#1e40af] text-white' : 'bg-[#dce9fe] text-[#2563eb]'} flex items-center justify-center font-bold text-[10px] border border-outline-variant`}>
                {currentOwner.initials}
              </div>
              <span className="font-body-md text-body-md text-on-surface hidden xl:block w-[45px] truncate">{currentOwner.name}</span>
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
              {MEMBERS.map((member) => (
                <button
                  key={member.id}
                  onClick={(e) => handleOwnerSelect(e, member)}
                  className="w-full text-left px-3 py-2 hover:bg-surface-container-low flex items-center gap-2 transition-colors"
                >
                  <div className={`w-5 h-5 rounded-full ${member.isPrimary ? 'bg-[#1e40af] text-white' : 'bg-[#dce9fe] text-[#2563eb]'} flex items-center justify-center font-bold text-[9px] border border-outline-variant`}>
                    {member.initials}
                  </div>
                  <span className="font-body-md text-sm text-on-surface">{member.name}</span>
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
