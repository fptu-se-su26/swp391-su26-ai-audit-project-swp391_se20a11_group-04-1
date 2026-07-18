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
  const [listMode, setListMode] = useState('mine'); // 'mine', 'all', or 'overview'

  // AI modals
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [generationId, setGenerationId] = useState(null);
  const [approveModalData, setApproveModalData] = useState(null);
  const [rejectModalData, setRejectModalData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(0);

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
        page: currentPage,
        size: pageSize,
        sort: 'createdAt,desc'
      };
      if (searchTerm) params.keyword = searchTerm;
      if (statusFilter && !isDraftView) params.status = statusFilter;
      if (reqFilter) params.requirementId = reqFilter;
      if (isDraftView) params.isDraft = true;

      if (listMode === 'mine') {
        params.mine = true;
      } else if (listMode === 'overview') {
        params.status = 'DONE,CONTENT_APPROVED,DIAGRAM_APPROVED,CLOSED';
      }

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
      const targetUserId = listMode === 'mine' ? userId : null;
      const data = await diagramService.getDiagramData(activeProject.id, targetUserId, listMode);
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
    setCurrentPage(0);
    setSearchTerm('');
    setStatusFilter('');
    setReqFilter('');
    setListMode('mine');
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
    setGeneratingCount(selectedIds.length);
    setGenerating(true);
    
    abortControllerRef.current = new AbortController();
    
    try {
      // Removed unused mineParam/statusParam logic
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

  const handleRefresh = (silent = false) => {
    fetchUseCases(!silent);
    fetchAllUseCases();
    fetchDiagramData();
  };

  const myFullUseCases = allUseCases.filter(uc => uc.createdById == userId);
  const functionalReqs = myRequirements.filter(req => req.type === 'FUNCTIONAL' && req.status !== 'CLOSED');
  const coveredReqIds = myFullUseCases.map(uc => uc.requirement?.id || uc.requirementId);
  const missingReqs = functionalReqs.filter(req => !coveredReqIds.includes(req.id));
  const activeUseCases = myFullUseCases.filter(uc => uc.requirement?.status !== 'CLOSED');
  const hasRejected = activeUseCases.some(uc => uc.status === 'REJECTED');
  const submittableStatuses = ['DRAFT', 'IN_PROGRESS'];
  const hasSubmittable = activeUseCases.some(uc => submittableStatuses.includes(uc.status));

  let canSubmit = false;
  let submitDisabledReason = '';

  if (listMode === 'mine') {
    if (missingReqs.length > 0) {
      const missingCodes = missingReqs.map(r => r.reqCode).join(', ');
      submitDisabledReason = `Missing Use Cases for ${missingReqs.length} assigned functional requirement(s): ${missingCodes}`;
    } else if (hasRejected) {
      submitDisabledReason = 'You have REJECTED Use Cases. Please edit and resolve them before submitting.';
    } else if (!hasSubmittable) {
      submitDisabledReason = 'No DRAFT or IN PROGRESS Use Cases to submit.';
    } else {
      canSubmit = true;
      submitDisabledReason = 'Submit all DRAFT and IN PROGRESS Use Cases for review';
    }
  }

  const handleSubmitUseCases = async () => {
    const draftsToSubmit = myFullUseCases.filter(uc => submittableStatuses.includes(uc.status));
    if (draftsToSubmit.length === 0) return;
    
    setLoading(true);
    try {
      await Promise.all(draftsToSubmit.map(uc => 
        useCaseService.updateUseCaseStatus(uc.id, 'IN_REVIEW', activeProject.id)
      ));
      toast.success(`Successfully submitted ${draftsToSubmit.length} Use Cases!`);
      handleRefresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit Use Cases.");
    } finally {
      setLoading(false);
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
        await useCaseService.updateUseCaseStatus(id, 'DRAFT', activeProject.id, reason);
        toast.success("Use Case Rejected.");
        handleRefresh();
      } catch (error) {
        toast.error("Error rejecting Use Case");
      }
    } else {
      setRejectModalData(id);
    }
  };

  const handleConfirmReject = async (reason) => {
    if (!rejectModalData) return;
    try {
      await useCaseService.updateUseCaseStatus(rejectModalData, 'DRAFT', activeProject.id, reason);
      toast.success("Use Case đã bị từ chối.");
      setRejectModalData(null);
      handleRefresh();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi từ chối Use Case");
      throw error;
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
            {/* List Mode toggle */}
            <div className="flex items-center gap-2 bg-white border border-[#D9E7E4] rounded-[10px] p-[3px]">
              <button
                onClick={() => { setListMode('mine'); setCurrentPage(0); }}
                className={`flex items-center justify-center h-[36px] px-[14px] rounded-[8px] text-[13px] font-medium transition-colors ${listMode === 'mine' ? 'bg-[#F3F4F6] text-primary' : 'bg-transparent text-[#6B7280] hover:text-primary'}`}
              >
                Mine
              </button>
              <button
                onClick={() => { setListMode('all'); setCurrentPage(0); }}
                className={`flex items-center justify-center h-[36px] px-[14px] rounded-[8px] text-[13px] font-medium transition-colors ${listMode === 'all' ? 'bg-[#F3F4F6] text-primary' : 'bg-transparent text-[#6B7280] hover:text-primary'}`}
              >
                All
              </button>
              <button
                onClick={() => { setListMode('overview'); setCurrentPage(0); }}
                className={`flex items-center justify-center h-[36px] px-[14px] rounded-[8px] text-[13px] font-medium transition-colors ${listMode === 'overview' ? 'bg-[#F3F4F6] text-primary' : 'bg-transparent text-[#6B7280] hover:text-primary'}`}
              >
                Overview
              </button>
            </div>

            {/* View Mode toggle */}
            <div className="flex items-center bg-white border border-[#D9E7E4] rounded-[10px] p-[3px]">
              <button
                onClick={() => setViewMode('diagram-view')}
                className={`flex items-center justify-center h-[36px] px-[14px] rounded-[8px] text-[13px] font-medium transition-colors ${viewMode.startsWith('diagram') ? 'text-white' : 'bg-transparent text-[#6B7280] hover:text-primary'}`}
                style={viewMode.startsWith('diagram') ? { background: 'linear-gradient(135deg, var(--project-theme-hover, #278A99) 0%, var(--project-theme, #1E707D) 55%, var(--project-theme-dark, #165964) 100%)' } : {}}
              >
                <span className="material-symbols-outlined text-[18px] mr-1">account_tree</span>
                Diagram
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center h-[36px] px-[14px] rounded-[8px] text-[13px] font-medium transition-colors ${viewMode === 'list' ? 'text-white' : 'bg-transparent text-[#6B7280] hover:text-primary'}`}
                style={viewMode === 'list' ? { background: 'linear-gradient(135deg, var(--project-theme-hover, #278A99) 0%, var(--project-theme, #1E707D) 55%, var(--project-theme-dark, #165964) 100%)' } : {}}
              >
                <span className="material-symbols-outlined text-[18px] mr-1">list</span>
                List View
              </button>
            </div>

            {/* Group 3: Generate Usecase */}
            <button
              type="button"
              onClick={() => setIsSelectionModalOpen(true)}
              className="h-[44px] px-5 bg-secondary-container text-on-secondary-container rounded-xl font-bold flex items-center justify-center hover:bg-secondary-fixed transition-colors text-[14px] shadow-sm"
            >
              Generate Usecase
            </button>

            {/* Group 4: Add Use Case */}
            <Button
              onClick={() => setIsModalOpen(true)}
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Add Use Case
            </Button>
          </div>
        </div>

        {viewMode.startsWith('diagram') ? (
          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {listMode === 'all' ? (
              <GroupedUCDiagramList 
                projectId={activeProject?.id}
                allUseCases={allUseCases}
                isLeader={isLeader}
                onApproveUseCase={isLeader ? handleApproveUseCase : undefined}
                onRejectUseCase={isLeader ? handleRejectUseCase : undefined}
                onRefresh={handleRefresh}
              />
            ) : (
              <UCDiagramEditorPage 
                projectId={activeProject?.id} 
                currentUserId={listMode === 'mine' ? userId : null}
                activeView={listMode}
                mode={viewMode === 'diagram-edit' ? 'edit' : 'view'} 
                onClose={() => setViewMode('list')} 
                onEdit={(listMode === 'mine' || isLeader) ? () => setViewMode('diagram-edit') : undefined}
                onView={() => setViewMode('diagram-view')}
                isLeader={isLeader}
                onApproveUseCase={isLeader ? handleApproveUseCase : undefined}
                onRejectUseCase={isLeader ? handleRejectUseCase : undefined}
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
              hideStatusFilter={listMode === 'overview'}
              hideDraftToggle={listMode === 'overview'}
            />
            <div className="relative flex-1">
              {loading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-b-xl">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E707D]"></div>
                </div>
              )}
              {useCases.length === 0 && !loading ? (
                <div className="flex items-center justify-center flex-1 p-10 flex-col">
                  <span className="material-symbols-outlined text-outline text-[48px] mb-2">inbox</span>
                  <span className="text-on-surface-variant">Chưa có Use Case nào. Hãy tạo mới!</span>
                </div>
              ) : listMode === 'all' ? (
                <GroupedUseCaseList 
                  useCases={useCases} 
                  allUseCases={allUseCases}
                  diagramData={diagramData}
                  listMode={listMode}
                  onRefresh={handleRefresh}
                  onApprove={isLeader ? handleApproveUseCase : undefined}
                  onReject={isLeader ? handleRejectUseCase : undefined}
                  pagination={{
                    currentPage,
                    totalPages,
                    totalItems: totalElements,
                    pageSize
                  }}
                  onPageChange={setCurrentPage}
                />
              ) : (
                <UseCaseList 
                  useCases={useCases} 
                  allUseCases={allUseCases}
                  diagramData={diagramData}
                  onEdit={listMode === 'mine' || (isLeader && listMode === 'overview') ? handleEditUseCase : undefined} 
                  onDelete={listMode === 'mine' || (isLeader && listMode === 'overview') ? handleDeleteUseCase : undefined} 
                  onRefresh={handleRefresh}
                  enableReorder={listMode === 'mine' || (isLeader && listMode === 'overview')}
                  onReorder={handleReorder}
                  onApprove={isLeader && listMode !== 'mine' ? handleApproveUseCase : undefined}
                  onReject={isLeader && listMode !== 'mine' ? handleRejectUseCase : undefined}
                />
              )}
            </div>
            {listMode !== 'all' && (
              <UseCasePagination 
                currentPage={currentPage}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            )}
            {/* Submit Button at Bottom Center */}
            {listMode === 'mine' && !viewMode.startsWith('diagram') && (
              <div className="flex justify-center pb-6 pt-2 bg-surface-container-lowest">
                <button
                  type="button"
                  onClick={() => {
                    if (!canSubmit) {
                      toast.error(submitDisabledReason);
                    } else {
                      handleSubmitUseCases();
                    }
                  }}
                  className="h-[36px] px-4 rounded-lg font-medium flex items-center justify-center transition-colors text-[13px] shadow hover:shadow-md bg-primary text-white hover:bg-[#11464f]"
                >
                  <span className="material-symbols-outlined mr-1.5 text-[16px]">send</span>
                  Submit
                </button>
              </div>
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
      <RequirementSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        onConfirm={handleGenerateAI}
      />
      <AiUseCaseGenerationModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        generationId={generationId}
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
      <RejectUseCaseModal
        isOpen={!!rejectModalData}
        onClose={() => setRejectModalData(null)}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
};

export default UseCasePage;
