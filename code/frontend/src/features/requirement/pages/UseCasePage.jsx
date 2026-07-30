import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UseCaseToolbar from '../components/UseCaseToolbar';
import UseCaseList from '../components/UseCaseList';
import GroupedUseCaseList from '../components/GroupedUseCaseList';
import GroupedUCDiagramList from '../components/GroupedUCDiagramList';
import UseCasePagination from '../components/UseCasePagination';
import Button from '../../../components/ui/Button';
import UseCaseFormModal from '../components/UseCaseFormModal';
import RequirementSelectionModal from '../components/RequirementSelectionModal';
import AiUseCaseGenerationModal from '../components/AiUseCaseGenerationModal';
import ApproveUseCaseModal from '../components/ApproveUseCaseModal';
import RejectUseCaseModal from '../components/RejectUseCaseModal';
import AIGenerationProgressModal from '../components/AIGenerationProgressModal';
import UCDiagramEditorPage from './UCDiagramEditorPage';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useCaseService } from '../services/useCaseService';
import { requirementApi } from '../services/requirementApi';
import { diagramService } from '../services/diagramService';
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
  const [myRequirements, setMyRequirements] = useState([]);
  const [diagramData, setDiagramData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // View mode: 'list' or 'editor'
  const [viewMode, setViewMode] = useState('list');
  const [listMode, setListMode] = useState('grouped'); // 'flat' or 'grouped'
  const [diagramTab, setDiagramTab] = useState('module'); // 'module' | 'overview'
  const [overviewEditorMode, setOverviewEditorMode] = useState('view');


  // AI modals
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [generationId, setGenerationId] = useState(null);
  const [approveModalData, setApproveModalData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(0);
  const [showUcCoverageWarning, setShowUcCoverageWarning] = useState(false);

  // Pagination & Filter state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reqFilter, setReqFilter] = useState('');
  const [isDraftView, setIsDraftView] = useState(false);

  useEffect(() => {
    setIsDraftView(false);
  }, [activeProject?.id]);

  const fetchUseCases = async (showLoading = true) => {
    if (!activeProject?.id) return;
    if (showLoading) setLoading(true);
    try {
      const params = {
        projectId: activeProject.id,
        page: listMode === 'grouped' ? 0 : currentPage,
        size: listMode === 'grouped' ? 1000 : pageSize,
        sort: 'createdAt,desc'
      };
      if (searchTerm) params.keyword = searchTerm;
      if (statusFilter && !isDraftView) params.status = statusFilter;
      if (reqFilter) params.requirementId = reqFilter;
      if (isDraftView) params.isDraft = true;

      const data = await useCaseService.searchUseCases(params);
      
      let fetchedUseCases = data.content || [];
      // Sort to push CLOSED Use Cases or Use Cases with CLOSED requirements to the bottom
      fetchedUseCases.sort((a, b) => {
        const aClosed = a.status === 'CLOSED' || a.requirement?.status === 'CLOSED';
        const bClosed = b.status === 'CLOSED' || b.requirement?.status === 'CLOSED';
        if (aClosed && !bClosed) return 1;
        if (!aClosed && bClosed) return -1;
        return 0;
      });
      setUseCases(fetchedUseCases);
      const pageInfo = data.page || data;
      setTotalPages(pageInfo.totalPages || 0);
      setTotalElements(pageInfo.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch use cases', error);
      toast.error('Không thể tải danh sách Use Case');
    } finally {
      if (showLoading) setLoading(false);
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

  const fetchDiagramData = async () => {
    if (!activeProject?.id) return;
    try {
      const data = await diagramService.getDiagramData(activeProject.id, null, 'all');
      setDiagramData(data);
    } catch (error) {
      console.error('Failed to fetch diagram data', error);
    }
  };

  const [allRequirements, setAllRequirements] = useState([]);

  const fetchMyRequirements = async () => {
    if (!activeProject?.id || isLeader) return;
    try {
      const data = await requirementApi.getAllRequirements({ projectId: activeProject.id, mine: true, size: 1000 });
      setMyRequirements(data.items || []);
    } catch (error) {
      console.error('Failed to fetch my requirements', error);
    }
  };

  const fetchAllRequirements = async () => {
    if (!activeProject?.id) return;
    try {
      const data = await requirementApi.getAllRequirements({ projectId: activeProject.id, size: 1000 });
      setAllRequirements(data.items || []);
    } catch (error) {
      console.error('Failed to fetch all requirements', error);
    }
  };

  useEffect(() => {
    fetchMyRequirements();
    fetchAllRequirements();
  }, [activeProject?.id, isLeader]);

  useEffect(() => {
    if (viewMode === 'list') {
      const delayDebounceFn = setTimeout(() => {
        fetchUseCases();
        fetchAllUseCases();
        fetchDiagramData();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, reqFilter, activeProject?.id, viewMode, isDraftView, listMode]);

  useEffect(() => {
    const handleRevert = () => {
      fetchUseCases();
      fetchAllUseCases();
      fetchDiagramData();
    };
    window.addEventListener('entityReverted', handleRevert);
    return () => window.removeEventListener('entityReverted', handleRevert);
  }, []);

  useEffect(() => {
    setCurrentPage(0);
    setSearchTerm('');
    setStatusFilter('');
    setReqFilter('');
    setListMode('grouped');
    setViewMode('list');
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

  const handleReqFilterChange = (val) => {
    setReqFilter(val);
    setCurrentPage(0);
  };

  const abortControllerRef = useRef(null);

  const handleGenerateAI = async (selectedIds) => {
    setIsSelectionModalOpen(false);
    
    if (!selectedIds || selectedIds.length === 0) {
      toast.error("Không tìm thấy Requirement nào! Vui lòng tạo Requirement trước khi tự động sinh Use Case.");
      return;
    }

    setGeneratingCount(selectedIds.length);
    setGenerating(true);
    
    abortControllerRef.current = new AbortController();
    
    try {
      const startTime = Date.now();
      const response = await useCaseService.generateUseCases(
        activeProject.id, 
        { requirementIds: selectedIds },
        { signal: abortControllerRef.current.signal }
      );
      
      const elapsed = Date.now() - startTime;
      if (elapsed < 12000 && !abortControllerRef.current.signal.aborted) {
         await new Promise((resolve, reject) => {
             const timer = setTimeout(resolve, 12000 - elapsed);
             abortControllerRef.current.signal.addEventListener('abort', () => {
                 clearTimeout(timer);
                 reject(new Error('canceled'));
             });
         });
      }
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

  const handleRefresh = (silent = false) => {
    fetchUseCases(!silent);
    fetchAllUseCases();
    fetchDiagramData();
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
      handleRefresh(true);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete Use Case');
    }
  };

  const handleEditUseCase = (useCase) => {
    navigate(`/projects/${activeProject.id}/use-cases/${useCase.id}`, { state: { edit: true } });
  };

  const handleReorder = async (newItems) => {
    setUseCases(newItems);
    if (!activeProject?.id) return;
    const ucIds = newItems.map(item => item.id);
    try {
      await useCaseService.reorderUseCasesGlobal(activeProject.id, ucIds);
    } catch (error) {
      console.error('Failed to reorder use cases:', error);
      toast.error('Failed to save order');
      fetchUseCases(false);
    }
  };

  const handleResetOrder = () => {
    if (!useCases || useCases.length === 0) return;
    const sorted = [...useCases].sort((a, b) => {
      const aClosed = a.status === 'CLOSED' || a.requirement?.status === 'CLOSED';
      const bClosed = b.status === 'CLOSED' || b.requirement?.status === 'CLOSED';
      if (aClosed && !bClosed) return 1;
      if (!aClosed && bClosed) return -1;
      return a.id - b.id;
    });
    handleReorder(sorted);
  };

  const handleApproveUseCase = async (id) => {
    setApproveModalData(id);
  };

  const handleRejectUseCase = async (id, reason) => {
    if (reason) {
      try {
        await useCaseService.updateUseCaseStatus(id, 'REJECTED', activeProject.id, reason);
        toast.success("Use Case Rejected.");
        handleRefresh();
      } catch (error) {
        toast.error("Error rejecting Use Case");
      }
    }
  };



  return (
    <div className="p-4 md:p-6 pt-2 md:pt-4 h-full relative">
      <AIGenerationProgressModal isOpen={generating} requirementCount={generatingCount} onClose={handleCancelGenerate} />
      <div className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-[28px] font-[700] text-[#111827]">Use Cases</h1>
            <p className="text-[13px] text-[#6B7280] mt-1">Manage and track system interactions and actor goals.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">

              <div className="flex bg-gray-100/50 p-1 rounded-xl items-center shadow-inner border border-gray-200">
                <button
                  onClick={() => setViewMode('diagram-view')}
                  className={`flex items-center justify-center h-[36px] px-[14px] rounded-[8px] text-[13px] font-medium transition-colors ${viewMode.startsWith('diagram') ? 'text-white' : 'bg-transparent text-[#6B7280] hover:text-primary'}`}
                  style={viewMode.startsWith('diagram') ? { background: 'linear-gradient(135deg, var(--project-theme-hover, #278A99) 0%, var(--project-theme, #1E707D) 55%, var(--project-theme-dark, #165964) 100%)' } : {}}
                >
                  <span className="material-symbols-outlined text-[18px] mr-1">account_tree</span>
                  Diagram
                </button>
                <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
                <button
                  onClick={() => { setViewMode('list'); setListMode('grouped'); }}
                  className={`flex items-center justify-center h-[36px] px-[14px] rounded-[8px] text-[13px] font-medium transition-colors ${(viewMode === 'list' && listMode === 'grouped') ? 'text-white' : 'bg-transparent text-[#6B7280] hover:text-primary'}`}
                  style={(viewMode === 'list' && listMode === 'grouped') ? { background: 'linear-gradient(135deg, var(--project-theme-hover, #278A99) 0%, var(--project-theme, #1E707D) 55%, var(--project-theme-dark, #165964) 100%)' } : {}}
                >
                  <span className="material-symbols-outlined text-[18px] mr-1">view_module</span>
                  Module List
                </button>
                <button
                  onClick={() => { setViewMode('list'); setListMode('flat'); }}
                  className={`flex items-center justify-center h-[36px] px-[14px] rounded-[8px] text-[13px] font-medium transition-colors ${(viewMode === 'list' && listMode === 'flat') ? 'text-white' : 'bg-transparent text-[#6B7280] hover:text-primary'}`}
                  style={(viewMode === 'list' && listMode === 'flat') ? { background: 'linear-gradient(135deg, var(--project-theme-hover, #278A99) 0%, var(--project-theme, #1E707D) 55%, var(--project-theme-dark, #165964) 100%)' } : {}}
                >
                  <span className="material-symbols-outlined text-[18px] mr-1">list</span>
                  Flat List
                </button>
              </div>

            {/* Group 3: Generate Usecase */}
            <button
              type="button"
              className={`h-[44px] px-5 bg-secondary-container text-on-secondary-container rounded-xl font-bold flex items-center justify-center transition-colors text-[14px] shadow-sm ${!isLeader ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary-fixed'}`}
              onClick={() => isLeader && handleGenerateAI(allRequirements.filter(req => req.status !== 'CLOSED').map(req => req.id))}
              disabled={!isLeader}
              title={!isLeader ? "Only Project Leader can generate use cases" : ""}
            >
              Generate Usecase
            </button>

            {/* Group 4: Add Use Case */}
            <Button
              onClick={() => isLeader && setIsModalOpen(true)}
              disabled={!isLeader}
              className={!isLeader ? 'opacity-50 cursor-not-allowed' : ''}
              title={!isLeader ? "Only Project Leader can add use cases" : ""}
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Add Use Case
            </Button>
          </div>
        </div>

        {viewMode.startsWith('diagram') ? (
          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {diagramTab === 'overview' ? (
              <UCDiagramEditorPage 
                projectId={activeProject?.id} 
                currentModuleId={null}
                activeView="all"
                mode={overviewEditorMode} 
                onClose={() => { setDiagramTab('module'); setOverviewEditorMode('view'); }} 
                onEdit={isLeader ? () => setOverviewEditorMode('edit') : undefined}
                onView={() => setOverviewEditorMode('view')}
                isLeader={isLeader}
                onApproveUseCase={isLeader ? handleApproveUseCase : undefined}
                onRejectUseCase={isLeader ? handleRejectUseCase : undefined}
              />
            ) : (
              <GroupedUCDiagramList 
                projectId={activeProject?.id}
                allUseCases={allUseCases}
                isLeader={isLeader}
                currentUserId={userId}
                projectMembers={activeProject?.members || []}
                diagramTab={diagramTab}
                onDiagramTabChange={setDiagramTab}
                onApproveUseCase={isLeader ? handleApproveUseCase : undefined}
                onRejectUseCase={isLeader ? handleRejectUseCase : undefined}
                onRefresh={handleRefresh}
              />
            )}
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col min-h-[400px]">
            <UseCaseToolbar 
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
              reqFilter={reqFilter}
              onReqFilterChange={handleReqFilterChange}
              requirements={allRequirements}
              isDraftView={isDraftView}
              setIsDraftView={(val) => {
                setIsDraftView(val);
                setCurrentPage(0);
              }}
              resultCount={totalElements}
              onResetOrder={handleResetOrder}
            />
            <div className="relative flex-1">
              {loading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-b-xl">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E707D]"></div>
                </div>
              )}
              {useCases.length === 0 && !loading && listMode !== 'grouped' ? (
                <div className="flex items-center justify-center flex-1 p-10 flex-col">
                  <span className="material-symbols-outlined text-outline text-[48px] mb-2">inbox</span>
                  <span className="text-on-surface-variant">Chưa có Use Case nào. Hãy tạo mới!</span>
                </div>
              ) : listMode === 'grouped' ? (
                <GroupedUseCaseList 
                  useCases={useCases} 
                  allUseCases={allUseCases}
                  diagramData={diagramData}
                  listMode={listMode}
                  isLeader={isLeader}
                  onEdit={handleEditUseCase}
                  onDelete={handleDeleteUseCase}
                  onRefresh={handleRefresh}
                  onApprove={handleApproveUseCase}
                  onReject={handleRejectUseCase}
                  isDraftView={isDraftView}
                  hasFilters={!!(searchTerm || statusFilter || reqFilter)}
                  pagination={null} // Grouped view shows all items at once, no pagination
                  onPageChange={setCurrentPage}
                />
              ) : (
                <UseCaseList 
                  useCases={isDraftView ? useCases.filter(uc => uc.status !== 'REJECTED') : useCases} 
                  allUseCases={allUseCases}
                  diagramData={diagramData}
                  onEdit={handleEditUseCase} 
                  onDelete={handleDeleteUseCase} 
                  onRefresh={handleRefresh}
                  onApprove={isDraftView ? handleApproveUseCase : undefined}
                  onReject={isDraftView ? handleRejectUseCase : undefined}
                  enableReorder={true}
                  onReorder={handleReorder}
                />
              )}
            </div>
            {listMode === 'flat' && (
              <UseCasePagination 
                currentPage={currentPage}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            )}

          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteUseCase}
        title="Delete Use Case"
        message="Are you sure you want to delete this Use Case? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
      <UseCaseFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={activeProject?.id}
        onSuccess={() => {
          setIsModalOpen(false);
          handleRefresh();
        }}
      />

      <AiUseCaseGenerationModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        generationId={generationId}
        onFullyCovered={() => setShowUcCoverageWarning(true)}
        onSuccess={() => {
          setIsAiModalOpen(false);
          handleRefresh();
        }}
      />
      <ApproveUseCaseModal
        isOpen={!!approveModalData}
        onClose={() => setApproveModalData(null)}
        useCaseId={approveModalData}
        projectId={activeProject?.id}
        onSuccess={() => {
          setApproveModalData(null);
          handleRefresh();
        }}
      />
      <ConfirmModal
        isOpen={showUcCoverageWarning}
        title="Fully Covered"
        message="AI could not generate new Use Cases. All Requirements are already fully covered by existing Use Cases."
        confirmText="Understood"
        hideCancel={true}
        type="info"
        onConfirm={() => setShowUcCoverageWarning(false)}
        onCancel={() => setShowUcCoverageWarning(false)}
      />
    </div>
  );
};

export default UseCasePage;
