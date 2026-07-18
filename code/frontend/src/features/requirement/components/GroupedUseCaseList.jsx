import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useCaseService } from '../services/useCaseService';
import useProjectStore from '../../../store/useProjectStore';
import InlineUseCaseItem from './InlineUseCaseItem';
import UseCasePagination from './UseCasePagination';

const UserGroupCard = ({ group, isLeader, onRefresh }) => {
  const activeProject = useProjectStore((state) => state.activeProject);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  const pendingUseCases = group.useCases.filter(uc => uc.status !== 'DONE' && uc.status !== 'REJECTED' && uc.status !== 'CONTENT_APPROVED');
  
  const handleApproveAll = async () => {
    if (pendingUseCases.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(pendingUseCases.map(uc => 
        useCaseService.approveUseCase(uc.id, activeProject.id, uc.requirementId, 'CONTENT')
      ));
      toast.success(`Approved ${pendingUseCases.length} Use Cases (Content).`);
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
        useCaseService.updateUseCaseStatus(uc.id, 'REJECTED', activeProject.id, rejectReason)
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
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group/card">
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
        
        <div className="ml-auto z-10 shrink-0 pl-2">
          <div className="flex items-center justify-center bg-primary/10 text-primary px-2 py-1 rounded-md gap-1">
            <span className="text-[12px] font-bold leading-none">{group.useCases.length}</span>
            <span className="text-[10px] font-semibold leading-none">Use Cases</span>
          </div>
        </div>
      </div>
      
      {/* Body: Compact Use Cases List */}
      <div className="flex flex-col flex-1 p-2 gap-2 overflow-y-auto max-h-[350px] custom-scrollbar bg-gray-50/30 pt-3">
        {[...group.useCases].sort((a, b) => {
          const aClosed = a.status === 'CLOSED' || a.requirement?.status === 'CLOSED';
          const bClosed = b.status === 'CLOSED' || b.requirement?.status === 'CLOSED';
          if (aClosed && !bClosed) return 1;
          if (!aClosed && bClosed) return -1;
          return 0;
        }).map((uc) => (
          <InlineUseCaseItem
            key={uc.id}
            uc={uc}
            isLeader={isLeader}
            onRefresh={onRefresh}
          />
        ))}
      </div>

      {/* Footer: Bulk Actions */}
      {isLeader && pendingUseCases.length > 0 && (
        <div className="border-t border-outline-variant bg-white p-3 flex flex-col gap-2">
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
};

const GroupedUseCaseList = ({
  useCases,
  allUseCases = [],
  diagramData,
  listMode,
  onEdit,
  onDelete,
  onRefresh,
  pagination,
  onPageChange,
  onApprove,
  onReject
}) => {
  
  // Group the use cases by createdById
  const groupedUseCases = useMemo(() => {
    const groups = {};
    useCases.forEach(uc => {
      // If we are in 'all' view, we only show pending review items (hide DONE/CLOSED/REJECTED/CONTENT_APPROVED/DRAFT)
      if (listMode === 'all' && (uc.status === 'DONE' || uc.status === 'CLOSED' || uc.status === 'REJECTED' || uc.status === 'CONTENT_APPROVED' || uc.status === 'DRAFT')) return;

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
      // Sort use cases within each group so that DONE/CLOSED are at the bottom
      const result = Object.values(groups);
      result.forEach(group => {
        group.useCases.sort((a, b) => {
          const aIsDone = a.status === 'DONE' || a.status === 'CLOSED';
          const bIsDone = b.status === 'DONE' || b.status === 'CLOSED';
          if (aIsDone && !bIsDone) return 1;
          if (!aIsDone && bIsDone) return -1;
          return 0;
        });
      });
      return result;
    }, [useCases, listMode]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'DONE': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'IN_REVIEW': return 'bg-purple-100 text-purple-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-16 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupedUseCases.map(group => (
          <UserGroupCard 
            key={group.creatorId} 
            group={group} 
            isLeader={!!onApprove} 
            onRefresh={onRefresh} 
          />
        ))}
      </div>

      {groupedUseCases.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm">
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-[40px]">inbox</span>
          </div>
          <span className="text-on-surface font-semibold text-lg mb-1">No Use Cases Found</span>
          <span className="text-on-surface-variant text-sm text-center max-w-md">There are no use cases matching your criteria or no members have created any use cases yet.</span>
        </div>
      )}

      {pagination && (
        <UseCasePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default GroupedUseCaseList;
