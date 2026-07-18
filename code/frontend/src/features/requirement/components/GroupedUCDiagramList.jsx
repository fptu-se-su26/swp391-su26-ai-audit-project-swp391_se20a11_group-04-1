import React, { useMemo, useState } from 'react';
import UCDiagramEditorPage from '../pages/UCDiagramEditorPage';
import { useCaseService } from '../services/useCaseService';
import toast from 'react-hot-toast';

const GroupedUCDiagramList = ({
  projectId,
  allUseCases = [],
  isLeader,
  onApproveUseCase,
  onRejectUseCase,
  onRefresh
}) => {
  // We only allow one accordion open at a time to prevent multiple diagram instances from conflicting with the global store
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Group the use cases by createdById
  const groupedMembers = useMemo(() => {
    const groups = {};
    allUseCases.forEach(uc => {
      const creatorId = uc.createdById || 'unknown';
      if (!groups[creatorId]) {
        groups[creatorId] = {
          creatorId,
          creatorName: uc.createdByName || uc.createdByUsername || 'Unknown User',
          creatorEmail: uc.createdByEmail || '',
          creatorAvatar: uc.createdByAvatar || '',
          useCases: []
        };
      }
      groups[creatorId].useCases.push(uc);
    });
    return Object.values(groups);
  }, [allUseCases]);

  const toggleAccordion = (creatorId) => {
    setActiveAccordion(prev => prev === creatorId ? null : creatorId);
  };

  if (activeAccordion) {
    const activeGroup = groupedMembers.find(g => g.creatorId === activeAccordion);
    const pendingUseCases = activeGroup ? activeGroup.useCases.filter(uc => uc.status !== 'DONE' && uc.status !== 'REJECTED' && uc.status !== 'DIAGRAM_APPROVED') : [];

    const handleApproveAll = async () => {
      if (pendingUseCases.length === 0) return;
      setLoading(true);
      try {
        await Promise.all(pendingUseCases.map(uc => 
          useCaseService.approveUseCase(uc.id, projectId, uc.requirementId, 'DIAGRAM')
        ));
        toast.success(`Approved ${pendingUseCases.length} Use Cases (Diagram).`);
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error(error);
        toast.error("Failed to approve Use Cases");
      } finally {
        setLoading(false);
      }
    };

    const handleRejectAll = async () => {
      if (!rejectReason.trim()) {
        toast.error("Vui lòng nhập lý do từ chối");
        return;
      }
      setLoading(true);
      try {
        await Promise.all(pendingUseCases.map(uc => 
          useCaseService.updateUseCaseStatus(uc.id, 'REJECTED', projectId, rejectReason)
        ));
        toast.success(`Rejected ${pendingUseCases.length} Use Cases.`);
        setIsRejecting(false);
        setRejectReason('');
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error(error);
        toast.error("Failed to reject Use Cases");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="flex flex-col h-full bg-surface-container-lowest">
        <div className="flex-1 overflow-hidden">
          <UCDiagramEditorPage 
            projectId={projectId}
            mode={isLeader ? 'edit' : 'view'}
            onClose={() => setActiveAccordion(null)}
            activeView="mine"
            currentUserId={activeAccordion}
            isLeader={isLeader}
          />
        </div>

        {/* Bulk Action Footer */}
        {isLeader && pendingUseCases.length > 0 && (
          <div className="border-t border-outline-variant bg-white p-3 flex flex-col gap-2 shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-gray-500">{pendingUseCases.length} pending review</span>
              <div className="flex gap-2">
                <button 
                  onClick={handleApproveAll} 
                  disabled={loading}
                  className="px-3 py-1.5 bg-primary hover:bg-[#11464f] text-white font-semibold rounded-md text-xs shadow-sm transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Approve
                </button>
                <button 
                  onClick={() => setIsRejecting(!isRejecting)} 
                  disabled={loading}
                  className={`px-3 py-1.5 font-semibold rounded-md text-xs shadow-sm transition-all disabled:opacity-50 flex items-center gap-1 ${
                    isRejecting 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent' 
                      : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{isRejecting ? 'close' : 'cancel'}</span>
                  {isRejecting ? 'Cancel' : 'Reject'}
                </button>
              </div>
            </div>
            
            {/* Bulk Reject Reason Input */}
            {isRejecting && (
              <div className="mt-2 flex gap-2 animate-in slide-in-from-top-2">
                <input 
                  type="text" 
                  placeholder="Lý do từ chối chung..." 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  disabled={loading}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-primary disabled:opacity-50"
                  autoFocus
                />
                <button 
                  onClick={handleRejectAll} 
                  disabled={loading}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium whitespace-nowrap disabled:opacity-50"
                >
                  Xác nhận
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-50/30 h-full overflow-y-auto custom-scrollbar">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-gray-800">Team Diagrams</h2>
        <p className="text-sm text-gray-500">Select a team member to view and review their use case diagrams.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupedMembers.map(group => (
          <div 
            key={group.creatorId} 
            onClick={() => toggleAccordion(group.creatorId)}
            className="bg-white rounded-xl border border-outline-variant shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 overflow-hidden flex flex-col group/card cursor-pointer"
          >
            {/* Header: User Info (Compact) */}
            <div className="flex items-center p-2.5 bg-gradient-to-br from-surface-container-low to-white border-b border-outline-variant relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-0 transition-transform duration-500 group-hover/card:scale-110"></div>
              
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[#165964] text-white font-bold text-sm mr-2.5 shadow-sm overflow-hidden shrink-0 z-10 border border-white">
                {group.creatorAvatar ? (
                  <img src={group.creatorAvatar} alt={group.creatorName} className="w-full h-full object-cover" />
                ) : (
                  group.creatorName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col z-10 min-w-0">
                <span className="font-bold text-on-surface text-[13px] truncate">{group.creatorName}</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-between p-3 bg-gray-50/50 flex-1">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="material-symbols-outlined text-[16px]">account_tree</span>
                <span className="text-[12px] font-medium">Use Case Diagram</span>
              </div>
              <div className="flex items-center justify-center bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/10 gap-1">
                <span className="text-[12px] font-bold leading-none">{group.useCases.length}</span>
                <span className="text-[10px] font-semibold leading-none">Nodes</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {groupedMembers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-outline-variant rounded-2xl shadow-sm">
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-[40px]">architecture</span>
          </div>
          <span className="text-on-surface font-semibold text-lg mb-1">No Diagrams Found</span>
          <span className="text-on-surface-variant text-sm text-center max-w-md">There are no use cases to display in the diagram viewer yet.</span>
        </div>
      )}
    </div>
  );
};

export default GroupedUCDiagramList;
