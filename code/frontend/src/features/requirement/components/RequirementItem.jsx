import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { requirementApi } from '../services/requirementApi';
import useProjectStore from '../../../store/useProjectStore';
import { getInitials, getAvatarColor } from '../../../utils/avatarHelper';
import toast from 'react-hot-toast';
import RequirementReviewModal from './RequirementReviewModal';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const RequirementItem = ({ req, onDelete, onEdit, onRefresh, isLeader }) => {
  const { id, title, type, priority, status, tags, tasksCount = 0, completedTasksCount = 0, evidenceCount = 0, reqCode, aiGenerated, startDate, deadline } = req;
  const navigate = useNavigate();
  
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
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
      ? { initials: initialMember.initials, name: initialMember.name, bg: initialMember.bg, id: initialMember.id }
      : { initials: null, name: null, bg: null, id: null }
  );

  const initialCoOwners = (req.coOwnerIds || []).map(id => getMemberById(id)).filter(Boolean);
  const [currentCoOwners, setCurrentCoOwners] = useState(initialCoOwners);

  // Sync owner state when req.ownerId changes (after parent re-fetches)
  useEffect(() => {
    const member = getMemberById(req.ownerId);
    setCurrentOwner(
      member
        ? { initials: member.initials, name: member.name, bg: member.bg, id: member.id }
        : { initials: null, name: null, bg: null, id: null }
    );
    const coOwners = (req.coOwnerIds || []).map(id => getMemberById(id)).filter(Boolean);
    setCurrentCoOwners(coOwners);
  }, [req.ownerId, req.coOwnerIds, projectMembers]);

  const handleOwnerSelect = async (e, member, isMainOwner) => {
    e.stopPropagation();
    
    let newOwner = currentOwner;
    let newCoOwners = [...currentCoOwners];
    
    if (isMainOwner) {
      if (currentOwner.id === member.id) {
        newOwner = { initials: null, name: null, bg: null, id: null };
      } else {
        newOwner = { initials: member.initials, name: member.name, bg: member.bg, id: member.id };
        newCoOwners = newCoOwners.filter(co => co.id !== member.id);
      }
    } else {
      if (newCoOwners.some(co => co.id === member.id)) {
        newCoOwners = newCoOwners.filter(co => co.id !== member.id);
      } else {
        newCoOwners.push(member);
        if (newOwner.id === member.id) {
          newOwner = { initials: null, name: null, bg: null, id: null };
        }
      }
    }
    
    setCurrentOwner(newOwner);
    setCurrentCoOwners(newCoOwners);
  };
  
  const handleSaveOwners = async (e) => {
    if (e) e.stopPropagation();
    setShowOwnerMenu(false);
    try {
      const payload = {
        projectId: activeProject?.id || req.projectId,
        title: req.title,
        description: req.description || '',
        type: req.type || 'FUNCTIONAL',
        priority: req.priority || 'MEDIUM',
        acceptanceCriteria: typeof req.acceptanceCriteria === 'string' ? req.acceptanceCriteria : JSON.stringify(req.acceptanceCriteria || []),
        ownerId: currentOwner.id, 
        coOwnerIds: currentCoOwners.map(m => m.id),
        startDate: req.startDate || null,
        deadline: req.deadline || null,
        evidenceRequired: req.evidenceRequired || false,
        tags: req.tags || [],
        status: req.status || 'IN_PROGRESS'
      };
      await requirementApi.updateRequirement(req.id, activeProject?.id, payload);
      // We no longer call onRefresh() here to avoid full page re-render jitter.
      // The state is already updated locally.
    } catch (error) {
      console.error('Lỗi khi cập nhật owner:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật người phụ trách');
      // Revert state if failed
      const prevMember = getMemberById(req.ownerId);
      setCurrentOwner(
        prevMember
          ? { initials: prevMember.initials, name: prevMember.name, bg: prevMember.bg, id: prevMember.id }
          : { initials: null, name: null, bg: null, id: null }
      );
      setCurrentCoOwners((req.coOwnerIds || []).map(id => getMemberById(id)).filter(Boolean));
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
    if (actionType === 'Delete') {
      onDelete(id);
    } else if (actionType === 'Edit') {
      onEdit(req);
    }
  };

  const handleApprove = async () => {
    try {
      await requirementApi.updateStatus(req.id, 'DONE');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Lỗi khi duyệt Requirement:', error);
    }
  };

  const handleCloseReq = async () => {
    try {
      await requirementApi.updateStatus(req.id, activeProject?.id, 'CLOSED');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Lỗi khi close Requirement:', error);
    }
  };

  const handleReopen = async (e) => {
    e.stopPropagation();
    try {
      await requirementApi.updateStatus(req.id, activeProject?.id, 'IN_PROGRESS');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Lỗi khi re-open Requirement:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const getDateStatus = () => {
    if (!deadline) return 'text-gray-500 bg-gray-100';
    if (status === 'DONE' || status === 'CLOSED') return 'text-gray-500 bg-gray-100';
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const dlDate = new Date(deadline);
    dlDate.setHours(0,0,0,0);
    
    const diffTime = dlDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-700 bg-red-100 border border-red-200'; // Trễ hạn
    if (diffDays <= 3) return 'text-amber-700 bg-amber-100 border border-amber-200'; // Sắp tới hạn (<= 3 ngày)
    return 'text-[#1E707D] bg-[#1E707D]/10 border border-[#1E707D]/20'; // Bình thường
  };

  const getRowStatus = () => {
    if (!deadline || status === 'DONE' || status === 'CLOSED') return 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300';
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const dlDate = new Date(deadline);
    dlDate.setHours(0,0,0,0);
    
    const diffTime = dlDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'border-red-400 shadow-[0_2px_12px_rgba(239,68,68,0.3)] z-10'; // Overdue glow
    if (diffDays <= 3) return 'border-amber-400 shadow-[0_2px_12px_rgba(245,158,11,0.3)] z-10'; // Approaching glow
    return 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300';
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: req.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : (showActionMenu || showOwnerMenu || showReviewModal) ? 50 : 1,
  };

  const allTasksDone = tasksCount > 0 && tasksCount === completedTasksCount;
  const isReadyForReview = isLeader && allTasksDone && status !== 'DONE' && status !== 'CLOSED';
  const isDimmed = status === 'CLOSED';

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-12 gap-3 px-stack_md py-3 items-center transition-all group border rounded-xl relative ${getRowStatus()} ${isDimmed ? 'bg-gray-100' : 'bg-white'}`}
    >
      {isDimmed && (
        <div className="absolute inset-0 bg-white/40 backdrop-grayscale backdrop-blur-[0.5px] rounded-xl z-0 pointer-events-none"></div>
      )}
      {/* Ready for Review Overlay */}
      {isReadyForReview && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1.5px] rounded-xl flex items-center justify-center gap-6 z-20 shadow-[inset_0_0_20px_rgba(255,255,255,0.8)]">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowReviewModal(true);
            }}
            className="bg-[#1E707D] text-white hover:bg-[#15535D] px-4 py-1.5 rounded-md text-sm font-medium shadow-md transition-transform hover:scale-105 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
            Review
          </button>
          {isLeader && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleCloseReq();
              }}
              className="bg-red-500 text-white hover:bg-red-600 px-4 py-1.5 rounded-md text-sm font-medium shadow-md transition-transform hover:scale-105 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              Close
            </button>
          )}
        </div>
      )}
      <div 
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 hover:bg-surface-container rounded transition-opacity"
        title="Drag to reorder"
      >
        <span className="material-symbols-outlined text-[20px] text-on-surface-variant">drag_indicator</span>
      </div>
      <div 
        onClick={() => navigate(`/projects/${activeProject?.id}/requirements/${id}`)}
        className="col-span-8 sm:col-span-5 md:col-span-4 lg:col-span-4 flex min-w-0 items-start gap-3 pl-6 cursor-pointer"
      >
        <span className="font-label-md text-label-md text-[#1E707D] bg-[#1E707D]/10 px-2 py-1 rounded font-bold shrink-0 mt-0.5">{reqCode || `REQ-${String(id).padStart(2, '0')}`}</span>
        <div className="min-w-0 flex flex-col gap-1">
          <span className="flex items-center gap-2">
            <span className="block truncate font-body-md text-body-md font-bold text-on-surface">{title}</span>
            {aiGenerated && <span className="inline-flex items-center gap-1 bg-[#1E707D]/10 text-[#1E707D] px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0" title="Generated by AI"><span className="material-symbols-outlined text-[12px]">auto_awesome</span> AI</span>}
          </span>
          <div className="flex items-center gap-2">
            <span className="block truncate font-body-md text-[11px] font-medium text-secondary">
              {type === 'FUNCTIONAL' ? 'Functional Requirement' : type === 'NON_FUNCTIONAL' ? 'Non-functional Requirement' : type}
            </span>
            {(startDate || deadline) && (
              <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${getDateStatus()}`}>
                <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                {startDate ? formatDate(startDate) : '?'} - {deadline ? formatDate(deadline) : '?'}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="col-span-3 sm:col-span-2 hidden sm:flex flex-col gap-1.5 items-center justify-center min-w-0">
        {status && (
          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
            status === 'DRAFT'        ? 'bg-slate-50 text-slate-600 border-slate-200' :
            status === 'IN_PROGRESS'  ? 'bg-amber-50 text-amber-700 border-amber-200' :
            status === 'IN_REVIEW'    ? 'bg-[#1E707D]/10 text-[#1E707D] border-[#1E707D]/20' :
            status === 'DONE'         ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            'bg-surface-container text-secondary border-outline-variant'
          }`}>
            {status.replace('_', ' ')}
          </span>
        )}
        {priority && (
          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
            priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
            priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
            priority === 'MEDIUM' ? 'bg-[#1E707D]/10 text-[#1E707D] border-[#1E707D]/20' :
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
      <div className="col-span-3 lg:col-span-2 hidden md:flex flex-col justify-center pr-4">
        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1">
          <span>PROGRESS</span>
          <span className="text-[#1E707D]">{tasksCount > 0 ? Math.round((completedTasksCount / tasksCount) * 100) : 0}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1.5 shadow-inner">
          <div className="bg-[#1E707D] h-1.5 rounded-full transition-all duration-500" style={{ width: `${tasksCount > 0 ? Math.round((completedTasksCount / tasksCount) * 100) : 0}%` }}></div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
          <span className="flex items-center gap-1" title="Tasks">
            <span className="material-symbols-outlined text-[12px]">checklist</span> {tasksCount}
          </span>
          <span className="flex items-center gap-1" title="Evidence">
            <span className="material-symbols-outlined text-[12px]">inventory_2</span> {evidenceCount}
          </span>
        </div>
      </div>
      <div className="col-span-4 sm:col-span-2 lg:col-span-2 flex items-center pr-2">
        {/* Owner Section */}
        <div className="flex-1 flex justify-center items-center relative" ref={ownerMenuRef}>
          <button 
            onClick={toggleOwnerMenu}
            className="flex items-center justify-center hover:bg-surface-container-low p-1 rounded-lg transition-colors group cursor-pointer"
            title="Change Assignee"
          >
            {currentOwner.initials || currentCoOwners.length > 0 ? (
              <div className="flex -space-x-2">
                {currentOwner.initials && (
                  <div 
                    className="w-7 h-7 rounded-full bg-[#1E707D] text-white flex items-center justify-center font-bold text-[10px] shadow-sm border-2 border-white shrink-0 relative z-10"
                    title={`Owner: ${currentOwner.name}`}
                  >
                    {getInitials(currentOwner.name)}
                  </div>
                )}
                {currentCoOwners.slice(0, 2).map((co, idx) => (
                  <div 
                    key={co.id}
                    className="w-7 h-7 rounded-full bg-slate-500 text-white flex items-center justify-center font-bold text-[10px] shadow-sm border-2 border-white shrink-0 relative"
                    style={{ zIndex: 9 - idx }}
                    title={`Co-owner: ${co.name}`}
                  >
                    {getInitials(co.name)}
                  </div>
                ))}
                {currentCoOwners.length > 2 && (
                  <div 
                    className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] shadow-sm border-2 border-white shrink-0 relative"
                    style={{ zIndex: 7 }}
                  >
                    +{currentCoOwners.length - 2}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-surface-container text-secondary flex items-center justify-center border border-outline-variant border-dashed group-hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-[14px]">add</span>
              </div>
            )}
          </button>

          {/* Owner Dropdown Menu */}
          {showOwnerMenu && (
            <div className="absolute top-full right-1/2 translate-x-1/2 mt-2 w-64 bg-surface border border-outline-variant rounded-lg shadow-xl py-2 z-50 flex flex-col max-h-[300px]">
              <div className="px-3 py-1 text-xs font-label-md text-secondary uppercase border-b border-outline-variant mb-1 text-left flex justify-between items-center">
                <span>Assign to</span>
                <span className="text-[10px] text-gray-400 lowercase normal-case italic">Select owner & co-owners</span>
              </div>
              
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {projectMembers.length === 0 && (
                  <div className="px-3 py-2 text-xs text-secondary italic text-center">
                    No active members in project
                  </div>
                )}
                {projectMembers.map((member) => {
                  const isMainOwner = currentOwner.id === member.id;
                  const isCoOwner = currentCoOwners.some(co => co.id === member.id);
                  return (
                    <div
                      key={member.id}
                      className="w-full text-left px-3 py-2 hover:bg-surface-container-low flex items-center gap-3 transition-colors cursor-pointer"
                      onClick={(e) => handleOwnerSelect(e, member, isMainOwner || (!isCoOwner && !currentOwner?.id))}
                    >
                      <input 
                        type="checkbox"
                        checked={isMainOwner || isCoOwner}
                        readOnly
                        className="w-4 h-4 text-[#1E707D] border-gray-300 rounded focus:ring-[#1E707D] accent-[#1E707D]"
                      />
                      <div 
                        className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-[10px] shadow-inner border border-outline-variant/40 shrink-0 ${isMainOwner ? 'bg-[#1E707D]' : 'bg-slate-500'}`}
                      >
                        {getInitials(member.name)}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-body-md text-sm text-on-surface truncate leading-tight">{member.name}</span>
                        {isMainOwner && <span className="text-[10px] font-bold text-[#1E707D]">Main Owner</span>}
                        {isCoOwner && <span className="text-[10px] text-slate-500">Co-owner</span>}
                      </div>
                      
                      {/* Button to toggle main owner status if they are just a co-owner */}
                      {isCoOwner && !isMainOwner && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOwnerSelect(e, member, true);
                          }}
                          className="text-[10px] bg-slate-100 hover:bg-[#1E707D]/10 hover:text-[#1E707D] text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 transition-colors"
                          title="Make Main Owner"
                        >
                          Set Main
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="px-3 pt-2 mt-1 border-t border-outline-variant flex justify-end">
                <button 
                  onClick={handleSaveOwners}
                  className="bg-[#1E707D] text-white text-xs px-4 py-1.5 rounded font-medium hover:bg-[#15535D] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Approve Button (Replaced by overlay, keeping empty space or alternate logic if needed) */}
        {allTasksDone && status !== 'DONE' && status !== 'CLOSED' ? null : status === 'IN_REVIEW' ? (
          <div className="flex-shrink-0 mr-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleApprove();
              }}
              className="text-emerald-600 hover:bg-emerald-50 p-1 rounded-full transition-colors flex items-center justify-center border border-transparent hover:border-emerald-200 shadow-sm bg-white"
              title="Duyệt nhanh (Approve)"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </button>
          </div>
        ) : null}

        {/* Action Menu Section or Re-open Button */}
        {status === 'CLOSED' ? (
          isLeader ? (
            <div className="flex justify-end flex-shrink-0 z-10 relative">
              <button
                onClick={handleReopen}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 shadow-sm transition-colors"
                title="Re-open Requirement"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                Re-open
              </button>
            </div>
          ) : null
        ) : (
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
                {status === 'DONE' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReviewModal(true);
                      setShowActionMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#1E707D] hover:bg-surface-container-low flex items-center gap-2 transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
                    Leader Review
                  </button>
                )}
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
        )}
      </div>

      {showReviewModal && (
        <RequirementReviewModal 
          requirement={req}
          onClose={(shouldRefresh) => {
            setShowReviewModal(false);
            if (shouldRefresh) {
              onRefresh(); // Trigger list refresh if reopened
            }
          }}
        />
      )}
    </div>
  );
};

export default RequirementItem;
