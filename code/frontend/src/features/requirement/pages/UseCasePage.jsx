import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UseCaseStats from '../components/UseCaseStats';
import UseCaseToolbar from '../components/UseCaseToolbar';
import UseCaseTable from '../components/UseCaseTable';
import UseCasePagination from '../components/UseCasePagination';
import Button from '../../../components/ui/Button';
import UseCaseFormModal from '../components/UseCaseFormModal';
import RequirementSelectionModal from '../components/RequirementSelectionModal';
import AiUseCaseGenerationModal from '../components/AiUseCaseGenerationModal';
import ApproveUseCaseModal from '../components/ApproveUseCaseModal';
import AIGenerationProgressModal from '../components/AIGenerationProgressModal';
import UCDiagramEditorPage from './UCDiagramEditorPage';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useCaseService } from '../services/useCaseService';
import { requirementApi } from '../services/requirementApi';
import useProjectStore from '../../../store/useProjectStore';
import useAuthStore from '../../../store/useAuthStore';
import toast from 'react-hot-toast';

const UseCasePage = () => {
  const navigate = useNavigate();
  const activeProject = useProjectStore((state) => state.activeProject);
  const { userId } = useAuthStore();
  const isLeader = ['PROJECT_LEADER', 'LEADER', 'Project Leader'].includes(activeProject?.role);
  const [useCases, setUseCases] = useState([]);
  const [allUseCases, setAllUseCases] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // View mode: 'list' or 'editor'
  const [viewMode, setViewMode] = useState('list');

  // AI modals
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [generationId, setGenerationId] = useState(null);
  const [approveModalData, setApproveModalData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(0);

  // Pagination & Filter state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isDraftView, setIsDraftView] = useState(false);

  useEffect(() => {
    setIsDraftView(false);
  }, [activeProject?.id]);

  const fetchUseCases = async () => {
    if (!activeProject?.id) return;
    setLoading(true);
    try {
      const params = {
        projectId: activeProject.id,
        page: currentPage,
        size: pageSize,
      };
      if (searchTerm) params.keyword = searchTerm;
      if (statusFilter && !isDraftView) params.status = statusFilter;
      if (isDraftView) params.isDraft = true;

      const data = await useCaseService.searchUseCases(params);
      
      setUseCases(data.content || []);
      const pageInfo = data.page || data;
      setTotalPages(pageInfo.totalPages || 0);
      setTotalElements(pageInfo.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch use cases', error);
      toast.error('Không thể tải danh sách Use Case');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUseCases = async () => {
    if (!activeProject?.id) return;
    try {
      const data = await useCaseService.getAllUseCases(activeProject.id);
      setAllUseCases(data || []);
    } catch (error) {
      console.error('Failed to fetch all use cases for stats', error);
    }
  };

  const handleRefresh = () => {
    fetchUseCases();
    fetchAllUseCases();
  };

  useEffect(() => {
    if (viewMode === 'list') {
      const delayDebounceFn = setTimeout(() => {
        fetchUseCases();
        fetchAllUseCases();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, activeProject?.id, viewMode, isDraftView]);

  useEffect(() => {
    setCurrentPage(0);
    setSearchTerm('');
    setStatusFilter('');
    setUseCases([]);
    fetchAllUseCases();
  }, [activeProject?.id]);

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(0);
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(0);
  };

  const abortControllerRef = useRef(null);

  const handleGenerateAI = async (selectedIds) => {
    setIsSelectionModalOpen(false);
    setGeneratingCount(selectedIds.length);
    setGenerating(true);
    
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await useCaseService.generateUseCases(
        activeProject.id, 
        { requirementIds: selectedIds },
        { signal: abortControllerRef.current.signal }
      );
      setGenerationId(response.generationId);
      setIsAiModalOpen(true);
    } catch (error) {
      if (error.name === 'CanceledError' || error.message === 'canceled') {
        console.log('Generation request canceled by user');
        return;
      }
      console.error(error);
      toast.error(error.response?.data?.message || 'Có lỗi khi sinh Use Case bằng AI');
    } finally {
      setGenerating(false);
    }
  };

  const handleCancelGenerate = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (activeProject?.id && generating) {
      try {
        await requirementApi.deletePendingGenerations(activeProject.id, 'USE_CASE');
      } catch (err) {
        console.error('Failed to clear pending use case generation:', err);
      }
    }
    setGenerating(false);
  };

  const handleDeleteUseCase = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteUseCase = async () => {
    if (!deleteConfirmId) return;
    try {
      await useCaseService.deleteUseCase(deleteConfirmId, activeProject.id);
      toast.success('Use Case deleted successfully');
      setDeleteConfirmId(null);
      handleRefresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete Use Case');
    }
  };

  const handleEditUseCase = (useCase) => {
    // Navigate to UseCaseDetailPage for editing
    navigate(`/projects/${activeProject.id}/use-cases/${useCase.id}`);
  };

  const handleApproveUseCase = async (id) => {
    setApproveModalData(id);
  };

  return (
    <div className="p-4 md:p-6 pt-2 md:pt-4 z-10 h-full relative">
      <AIGenerationProgressModal isOpen={generating} requirementCount={generatingCount} onClose={handleCancelGenerate} />
      <div className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-[28px] font-[700] text-[#111827]">Use Cases</h1>
            <p className="text-[13px] text-[#6B7280] mt-1">Manage and track system interactions and actor goals.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode toggle */}
            <div className="flex items-center bg-white border border-[#D9E7E4] rounded-[10px] p-[3px]">
              <button
                onClick={() => setViewMode('diagram-view')}
                className={`flex items-center justify-center h-[36px] px-[14px] rounded-[8px] text-[13px] font-medium transition-colors ${viewMode.startsWith('diagram') ? 'text-white' : 'bg-transparent text-[#6B7280] hover:text-[#1E707D]'}`}
                style={viewMode.startsWith('diagram') ? { background: 'linear-gradient(135deg, #278A99 0%, #1E707D 55%, #165964 100%)' } : {}}
              >
                <span className="material-symbols-outlined text-[18px] mr-1">account_tree</span>
                Diagram
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center h-[36px] px-[14px] rounded-[8px] text-[13px] font-medium transition-colors ${viewMode === 'list' ? 'text-white' : 'bg-transparent text-[#6B7280] hover:text-[#1E707D]'}`}
                style={viewMode === 'list' ? { background: 'linear-gradient(135deg, #278A99 0%, #1E707D 55%, #165964 100%)' } : {}}
              >
                <span className="material-symbols-outlined text-[18px] mr-1">list</span>
                List View
              </button>
            </div>

            {/* Group 2: Filter button */}
            <button className="flex items-center justify-center h-[36px] px-[14px] bg-white border border-[#D9E7E4] rounded-[10px] text-[13px] font-medium text-[#374151] hover:bg-[#D7EEF1] hover:text-[#1E707D] hover:border-[#1E707D] transition-colors">
              <span className="material-symbols-outlined text-[14px] mr-1">filter_list</span>
              Filter
            </button>

            {/* Group 3: Generate Usecase */}
            {isLeader && (
            <Button
              onClick={() => setIsSelectionModalOpen(true)}
            >
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              Generate Usecase
            </Button>
            )}

            {/* Group 4: Add Use Case */}
            {isLeader && (
            <Button
              onClick={() => setIsModalOpen(true)}
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Add Use Case
            </Button>
            )}
          </div>
        </div>

        <UseCaseStats useCases={allUseCases} />

        {viewMode.startsWith('diagram') ? (
          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <UCDiagramEditorPage 
              projectId={activeProject?.id} 
              mode={viewMode === 'diagram-edit' ? 'edit' : 'view'} 
              onClose={() => setViewMode('list')} 
              onEdit={isLeader ? () => setViewMode('diagram-edit') : undefined}
            />
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col min-h-[400px]">
            <UseCaseToolbar 
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
              isDraftView={isDraftView}
              setIsDraftView={(val) => {
                setIsDraftView(val);
                setCurrentPage(0);
              }}
            />
          {loading ? (
            <div className="flex items-center justify-center flex-1 p-10">
              <span className="text-secondary font-medium">Đang tải dữ liệu...</span>
            </div>
          ) : useCases.length === 0 ? (
            <div className="flex items-center justify-center flex-1 p-10 flex-col">
              <span className="material-symbols-outlined text-outline text-[48px] mb-2">inbox</span>
              <span className="text-on-surface-variant">Chưa có Use Case nào. Hãy tạo mới!</span>
            </div>
          ) : (
            <UseCaseTable 
              useCases={useCases} 
              onEdit={isLeader ? handleEditUseCase : undefined} 
              onDelete={isLeader ? handleDeleteUseCase : undefined} 
              onApprove={isLeader ? handleApproveUseCase : undefined}
              isDraftView={isDraftView}
            />
          )}
            <UseCasePagination 
              currentPage={currentPage}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
      
      <UseCaseFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleRefresh} 
      />
      
      <RequirementSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        onConfirm={handleGenerateAI}
      />
      
      <AiUseCaseGenerationModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        generationId={generationId}
        onSuccess={handleRefresh}
      />
      
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Xóa Use Case"
        message="Bạn có chắc chắn muốn xóa Use Case này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={confirmDeleteUseCase}
        onCancel={() => setDeleteConfirmId(null)}
        type="danger"
      />
      
      <ApproveUseCaseModal
        isOpen={!!approveModalData}
        onClose={() => setApproveModalData(null)}
        useCaseId={approveModalData}
        projectId={activeProject?.id}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default UseCasePage;
