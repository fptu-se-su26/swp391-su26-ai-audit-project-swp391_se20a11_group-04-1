import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import RequirementHeader from '../components/RequirementHeader';
import RequirementFilters from '../components/RequirementFilters';
import RequirementList from '../components/RequirementList';
import CreateRequirementModal from '../components/CreateRequirementModal';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { requirementApi } from '../services/requirementApi';
import useProjectStore from '../../../store/useProjectStore';

const PAGE_SIZE = 10;

const initialPagination = {
  currentPage: 0,
  pageSize: PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
  hasMore: false
};

const RequirementsPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(true);
  const [editingReq, setEditingReq] = useState(null);
  const [filters, setFilters] = useState({ status: null, priority: null, tag: null });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '0', 10);
  const setCurrentPage = React.useCallback((page) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', page);
      return newParams;
    });
  }, [setSearchParams]);

  const [reqToDelete, setReqToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const activeProject = useProjectStore((state) => state.activeProject);
  const activeProjectId = activeProject?.id;

  const buildRequestParams = (page) => ({
    page,
    size: PAGE_SIZE,
    projectId: activeProjectId,
    status: filters.status,
    priority: filters.priority,
    tag: filters.tag,
    search: filters.search
  });

  const applyRequirementResponse = (data) => {
    const items = data.items ?? data;

    setRequirements(items);
    setPagination({
      currentPage: data.currentPage ?? 0,
      pageSize: data.pageSize ?? PAGE_SIZE,
      totalItems: data.totalItems ?? items.length,
      totalPages: data.totalPages ?? (items.length > 0 ? 1 : 0),
      hasMore: data.hasMore ?? false
    });
  };

  const fetchRequirements = async (page = currentPage, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setErrorMessage('');
      if (!activeProjectId) {
        applyRequirementResponse({ items: [], currentPage: 0, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 0, hasMore: false });
        return;
      }
      const data = await requirementApi.getAllRequirements(buildRequestParams(page));
      applyRequirementResponse(data);
    } catch (error) {
      console.error('Error loading requirements:', error);
      setErrorMessage(error.response?.data?.message || 'Unable to load requirements. Please try again.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements(currentPage);
  }, [currentPage, filters, activeProjectId]);

  const silentFetchRequirements = () => {
    fetchRequirements(currentPage, false);
  };

  const initiateDelete = (id) => {
    setReqToDelete(id);
  };

  const confirmDelete = async () => {
    if (!reqToDelete) return;

    try {
      await requirementApi.deleteRequirement(reqToDelete);

      if (requirements.length === 1 && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      } else {
        silentFetchRequirements();
      }
    } catch (error) {
      console.error('Error deleting requirement:', error);
      alert('Delete failed!');
    } finally {
      setReqToDelete(null);
    }
  };

  const handleEdit = (req) => {
    setEditingReq(req);
    setIsCreateModalOpen(true);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingReq(null);
  };

  const handleModalSuccess = () => {
    const nextPage = editingReq ? currentPage : 0;
    setCurrentPage(nextPage);
    fetchRequirements(nextPage, false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFilterChange = React.useCallback((nextFilters) => {
    setFilters(prev => {
      const isSame = prev.status === nextFilters.status && 
                     prev.priority === nextFilters.priority && 
                     prev.tag === nextFilters.tag && 
                     prev.search === nextFilters.search;
      
      if (!isSame) {
        setTimeout(() => setCurrentPage(0), 0);
        return nextFilters;
      }
      return prev;
    });
  }, [setCurrentPage]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 0 || nextPage >= pagination.totalPages || nextPage === currentPage) return;
    setCurrentPage(nextPage);
  };

  const handleReorder = async (newItems) => {
    // Optimistically update the UI
    setRequirements(newItems);
    
    // Extract ordered IDs
    const reqIds = newItems.map(item => item.id);
    
    try {
      await requirementApi.reorderRequirements(activeProjectId, reqIds);
      // Optional: show a toast or silently succeed
    } catch (error) {
      console.error('Failed to reorder requirements:', error);
      // Revert on failure
      fetchRequirements(currentPage);
    }
  };

  const handleResetOrder = () => {
    if (!requirements || requirements.length === 0) return;
    const sorted = [...requirements].sort((a, b) => a.id - b.id);
    handleReorder(sorted);
  };

  return (
    <>
      <RequirementHeader onOpenCreateModal={() => { setEditingReq(null); setIsCreateModalOpen(true); }} />
      <RequirementFilters 
         onFilterChange={handleFilterChange} 
         resultCount={pagination.totalItems} 
         projectId={activeProjectId} 
         refreshTrigger={refreshTrigger} 
         onResetOrder={handleResetOrder}
      />

      {errorMessage ? (
        <div className="flex justify-center items-center py-10 text-error">
          {errorMessage}
        </div>
      ) : requirements.length === 0 && !loading ? (
        <div className="flex justify-center items-center py-10 text-secondary">
          No requirements match the current filters.
        </div>
      ) : (
        <div className={`transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <RequirementList
            requirements={requirements}
            onDelete={initiateDelete}
            onEdit={handleEdit}
            onRefresh={silentFetchRequirements}
            pagination={pagination}
            onPageChange={handlePageChange}
            onReorder={handleReorder}
          />
        </div>
      )}

      {isCreateModalOpen && (
        <CreateRequirementModal
          isOpen={isCreateModalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          editingData={editingReq}
          projectId={activeProjectId}
        />
      )}

      <ConfirmModal
        isOpen={!!reqToDelete}
        title="Delete Requirement?"
        message="Are you sure you want to delete this requirement? Deleted data cannot be recovered."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setReqToDelete(null)}
      />
    </>
  );
};

export default RequirementsPage;
