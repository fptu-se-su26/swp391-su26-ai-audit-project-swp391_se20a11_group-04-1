import React, { useState, useEffect, useCallback } from 'react';
import { evidenceService } from '../services/evidenceService';
import EvidenceStats from '../components/EvidenceStats';
import EvidenceToolbar from '../components/EvidenceToolbar';
import EvidenceCard from '../components/EvidenceCard';
import EvidenceTable from '../components/EvidenceTable';
import EvidencePagination from '../components/EvidencePagination';
import EvidenceFormModal from '../components/EvidenceFormModal';
import EvidenceDeleteConfirmModal from '../components/EvidenceDeleteConfirmModal';
import Button from '../../../components/ui/Button';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';

/**
 * EvidenceListPage — Trang danh sách Evidence Vault
 * Hỗ trợ Grid View + Table View, search, filter, pagination, CRUD
 */
const EvidenceListPage = () => {
  const { projectId } = useParams();
  // Data state
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filter state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // View mode
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editEvidence, setEditEvidence] = useState(null);
  const [deleteEvidence, setDeleteEvidence] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });

  // Fetch evidence list
  const fetchEvidences = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        projectId: projectId,
        page: currentPage,
        size: pageSize,
      };
      if (searchTerm) params.keyword = searchTerm;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const data = await evidenceService.searchEvidence(params);

      // Use the PageResponse structure directly
      setEvidences(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);

      // Calculate stats from response
      const allItems = data.content || [];
      setStats({
        total: data.totalElements || allItems.length,
        pending: allItems.filter((e) => e.status === 'PENDING' || e.status === 'AUTO_CHECKED').length,
        accepted: allItems.filter((e) => e.status === 'ACCEPTED').length,
        rejected: allItems.filter((e) => e.status === 'REJECTED').length,
      });
    } catch (error) {
      console.error('Failed to fetch evidence:', error);
      toast.error('Không thể tải danh sách Evidence');
      // On error, clear data
      setEvidences([]);
      setTotalPages(0);
      setTotalElements(0);
      setStats({ total: 0, pending: 0, accepted: 0, rejected: 0 });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, typeFilter, statusFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (projectId) {
        fetchEvidences();
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchEvidences, projectId]);

  // Handlers
  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(0);
  };

  const handleTypeFilterChange = (val) => {
    setTypeFilter(val);
    setCurrentPage(0);
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(0);
  };

  const handleCreateOrUpdate = async (formData, editId) => {
    try {
      formData.append('projectId', projectId);
      if (editId) {
        await evidenceService.updateEvidence(editId, formData);
        toast.success('Evidence updated successfully');
      } else {
        await evidenceService.createEvidence(formData);
        toast.success('Evidence uploaded successfully');
      }
      fetchEvidences();
    } catch (error) {
      console.error('Failed to save evidence:', error);
      toast.error('Failed to save evidence');
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deleteEvidence) return;
    setIsDeleting(true);
    try {
      await evidenceService.deleteEvidence(deleteEvidence.id);
      toast.success('Evidence deleted successfully');
      setDeleteEvidence(null);
      fetchEvidences();
    } catch (error) {
      console.error('Failed to delete evidence:', error);
      toast.error('Failed to delete evidence');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (ev) => {
    setEditEvidence(ev);
    setIsFormModalOpen(true);
  };

  const openCreate = () => {
    setEditEvidence(null);
    setIsFormModalOpen(true);
  };

  return (
    <div className="p-6 md:p-10 z-10 h-full">
      <div className="max-w-[1400px] mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-stack_lg">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface">Evidence Vault</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Manage and review verification artifacts for project requirements.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center bg-surface-container-low border border-outline-variant rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
                title="Grid View"
              >
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
                title="Table View"
              >
                <span className="material-symbols-outlined text-[20px]">view_list</span>
              </button>
            </div>

            <Button variant="primary" onClick={openCreate}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload_file</span>
              <span>Upload Evidence</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <EvidenceStats stats={stats} />

        {/* Main Data Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col min-h-[400px]">
          <EvidenceToolbar
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            typeFilter={typeFilter}
            onTypeFilterChange={handleTypeFilterChange}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
          />

          {loading ? (
            <div className="flex items-center justify-center flex-1 p-10">
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[36px] animate-spin">progress_activity</span>
                <span className="text-secondary font-medium font-body-md text-body-md">Loading evidence...</span>
              </div>
            </div>
          ) : evidences.length === 0 ? (
            <div className="flex items-center justify-center flex-1 p-10 flex-col">
              <span className="material-symbols-outlined text-outline text-[48px] mb-3">inventory_2</span>
              <span className="text-on-surface font-medium font-body-md text-[16px] mb-1">No evidence found</span>
              <span className="text-on-surface-variant font-body-md text-[13px] mb-4">
                {searchTerm || typeFilter || statusFilter
                  ? 'Try adjusting your filters.'
                  : 'Upload your first evidence to get started.'}
              </span>
              {!searchTerm && !typeFilter && !statusFilter && (
                <Button variant="primary" onClick={openCreate}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload_file</span>
                  <span>Upload Evidence</span>
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {evidences.map((ev) => (
                  <EvidenceCard key={ev.id} evidence={ev} />
                ))}
              </div>
            </div>
          ) : (
            <EvidenceTable evidences={evidences} />
          )}

          <EvidencePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      <EvidenceFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditEvidence(null);
        }}
        onSuccess={handleCreateOrUpdate}
        editData={editEvidence}
      />

      {/* Delete Confirm Modal */}
      <EvidenceDeleteConfirmModal
        isOpen={!!deleteEvidence}
        evidence={deleteEvidence}
        onConfirm={handleDelete}
        onClose={() => setDeleteEvidence(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default EvidenceListPage;
