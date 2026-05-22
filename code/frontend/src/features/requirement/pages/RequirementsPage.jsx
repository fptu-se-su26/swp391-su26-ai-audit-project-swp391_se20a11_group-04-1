import React, { useEffect, useState } from 'react';
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
  const [currentPage, setCurrentPage] = useState(0);
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
    tag: filters.tag
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
        fetchRequirements(currentPage);
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
    fetchRequirements(nextPage);
  };

  const handleFilterChange = (nextFilters) => {
    setFilters(nextFilters);
    setCurrentPage(0);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 0 || nextPage >= pagination.totalPages || nextPage === currentPage) return;
    setCurrentPage(nextPage);
  };

  return (
    <>
      <RequirementHeader onOpenCreateModal={() => { setEditingReq(null); setIsCreateModalOpen(true); }} />
      <RequirementFilters onFilterChange={handleFilterChange} resultCount={pagination.totalItems} />

      {loading ? (
        <div className="flex justify-center items-center py-10 text-secondary">
          Loading requirements...
        </div>
      ) : errorMessage ? (
        <div className="flex justify-center items-center py-10 text-error">
          {errorMessage}
        </div>
      ) : requirements.length === 0 ? (
        <div className="flex justify-center items-center py-10 text-secondary">
          No requirements match the current filters.
        </div>
      ) : (
        <RequirementList
          requirements={requirements}
          onDelete={initiateDelete}
          onEdit={handleEdit}
          onRefresh={silentFetchRequirements}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
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
