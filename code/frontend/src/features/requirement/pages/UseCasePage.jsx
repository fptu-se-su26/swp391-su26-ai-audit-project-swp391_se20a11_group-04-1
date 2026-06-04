import React, { useState, useEffect } from 'react';
import UseCaseStats from '../components/UseCaseStats';
import UseCaseToolbar from '../components/UseCaseToolbar';
import UseCaseTable from '../components/UseCaseTable';
import UseCasePagination from '../components/UseCasePagination';
import Button from '../../../components/ui/Button';
import UseCaseFormModal from '../components/UseCaseFormModal';
import RequirementSelectionModal from '../components/RequirementSelectionModal';
import AiUseCaseGenerationModal from '../components/AiUseCaseGenerationModal';
import AIGenerationProgressModal from '../components/AIGenerationProgressModal';
import GlobalUMLMap from '../components/GlobalUMLMap';
import UseCaseSidePanel from '../components/UseCaseSidePanel';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { useCaseService } from '../services/useCaseService';
import useProjectStore from '../../../store/useProjectStore';
import toast from 'react-hot-toast';

const UseCasePage = () => {
  const activeProject = useProjectStore((state) => state.activeProject);
  const [useCases, setUseCases] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // View mode: 'list' or 'map'
  const [viewMode, setViewMode] = useState('list');
  const [selectedMapNodeId, setSelectedMapNodeId] = useState(null);

  // AI modals
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [generationId, setGenerationId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(0);

  // Pagination & Filter state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
      if (statusFilter) params.status = statusFilter;

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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUseCases();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, pageSize, searchTerm, statusFilter, activeProject?.id]);

  useEffect(() => {
    setCurrentPage(0);
    setSearchTerm('');
    setStatusFilter('');
    setUseCases([]);
  }, [activeProject?.id]);

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(0);
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(0);
  };

  const handleGenerateAI = async (selectedIds) => {
    setIsSelectionModalOpen(false);
    setGeneratingCount(selectedIds.length);
    setGenerating(true);
    try {
      const response = await useCaseService.generateUseCases(activeProject.id, { requirementIds: selectedIds });
      setGenerationId(response.generationId);
      setIsAiModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Có lỗi khi sinh Use Case bằng AI');
    } finally {
      setGenerating(false);
    }
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
      fetchUseCases();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete Use Case');
    }
  };

  const handleEditUseCase = (useCase) => {
    // Navigate to UseCaseDetailPage for editing
    window.location.href = `/projects/${activeProject.id}/use-cases/${useCase.id}`;
  };

  return (
    <div className="p-4 md:p-6 pt-2 md:pt-4 z-10 h-full relative">
      <AIGenerationProgressModal isOpen={generating} requirementCount={generatingCount} onClose={() => setGenerating(false)} />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-[28px] font-[700] text-[#111827]">Use Cases</h1>
            <p className="text-[13px] text-[#6B7280] mt-1">Manage and track system interactions and actor goals.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Group 1: View toggle */}
            <div className="flex items-center bg-white border border-[#E5E7EB] rounded-[10px] p-[3px]">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center justify-center h-[36px] px-[14px] rounded-[8px] text-[13px] font-medium transition-colors ${viewMode === 'map' ? 'bg-[#185FA5] text-white' : 'bg-transparent text-[#6B7280] hover:text-[#111827]'}`}
              >
                <span className="material-symbols-outlined text-[18px] mr-1">grid_view</span>
                Map View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center h-[36px] px-[14px] rounded-[8px] text-[13px] font-medium transition-colors ${viewMode === 'list' ? 'bg-[#185FA5] text-white' : 'bg-transparent text-[#6B7280] hover:text-[#111827]'}`}
              >
                <span className="material-symbols-outlined text-[18px] mr-1">list</span>
                List View
              </button>
            </div>

            {/* Group 2: Filter button */}
            <button className="flex items-center justify-center h-[36px] px-[14px] bg-white border border-[#E5E7EB] rounded-[10px] text-[13px] font-medium text-[#374151] hover:bg-gray-50 transition-colors">
              <span className="material-symbols-outlined text-[14px] mr-1">filter_list</span>
              Filter
            </button>

            {/* Group 3: Generate Usecase */}
            <button 
              onClick={() => setIsSelectionModalOpen(true)}
              className="flex items-center justify-center h-[36px] px-[16px] rounded-[10px] text-[13px] font-[500] text-white transition-all duration-300 shadow-sm hover:brightness-110 hover:shadow-[0_0_12px_rgba(83,74,183,0.35)]"
              style={{ background: 'linear-gradient(135deg, #3C3489 0%, #185FA5 100%)' }}
            >
              <span className="material-symbols-outlined text-[14px] mr-1">auto_awesome</span>
              Generate Usecase
            </button>

            {/* Group 4: Add Use Case */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center h-[36px] px-[16px] bg-[#185FA5] hover:bg-[#0C447C] rounded-[10px] text-[13px] font-[500] text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[14px] mr-1">add</span>
              Add Use Case
            </button>
          </div>
        </div>

        <UseCaseStats useCases={useCases} />

        {viewMode === 'map' ? (
          <GlobalUMLMap 
            projectId={activeProject?.id} 
            onNodeClick={(id) => setSelectedMapNodeId(id)} 
          />
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col min-h-[400px]">
            <UseCaseToolbar 
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
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
              onEdit={handleEditUseCase} 
              onDelete={handleDeleteUseCase} 
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
        onSuccess={fetchUseCases} 
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
        onSuccess={fetchUseCases}
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
      
      <UseCaseSidePanel
        useCaseId={selectedMapNodeId}
        activeProjectId={activeProject?.id}
        onClose={() => setSelectedMapNodeId(null)}
      />
    </div>
  );
};

export default UseCasePage;
