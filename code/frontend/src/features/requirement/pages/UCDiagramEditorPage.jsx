import React, { useEffect, useState, useCallback, useRef } from 'react';
import useDiagramStore from '../../../store/useDiagramStore';
import DiagramSidePanel from '../components/DiagramSidePanel';
import { UCDiagram } from '../components/UCDiagram';
import { diagramService } from '../services/diagramService';
import { requirementApi } from '../services/requirementApi';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';

const UCDiagramEditorPage = ({ projectId, mode = 'edit', onClose, onEdit, onView, isLeader, onApproveUseCase, onRejectUseCase, activeView, currentUserId }) => {
  const { actors, useCases, relations, loadData, reset } = useDiagramStore();
  const [systemName, setSystemName] = useState("System");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'unsaved', 'saving', 'error'
  const diagramRef = useRef(null);
  
  const isViewMode = mode === 'view';
  
  // Resizer states
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    if (!projectId) return;
    
    const fetchDiagram = async () => {
      setLoading(true);
      try {
        // Fetch requirements check
        try {
          const reqData = await requirementApi.getAllRequirements({ projectId, size: 1 });
          if (!reqData || reqData.empty || (reqData.items && reqData.items.length === 0) || (reqData.content && reqData.content.length === 0) || (Array.isArray(reqData) && reqData.length === 0)) {
            toast.error("Dự án hiện chưa có Requirement nào. Bạn sẽ không thể tạo thêm Use Case mới từ bản vẽ!", { duration: 6000 });
          }
        } catch (err) {
          console.warn("Failed to check requirements", err);
        }

        const data = await diagramService.getDiagramData(projectId, currentUserId, activeView);
        if (data) {
          loadData({
            actors: data.actors || [],
            useCases: data.useCases || [],
            relations: data.relations || []
          });
        }
      } catch (error) {
        console.error("Failed to load diagram data", error);
        toast.error("Failed to load diagram data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDiagram();

    // Clear the store when unmounting
    return () => {
      isMounted.current = false;
      reset();
    };
  }, [projectId, loadData, reset, currentUserId, activeView]);

  const handleDiagramSave = useCallback(async (base64Png, positions) => {
    if (!projectId) return;
    setSaveStatus('saving');
    try {
      // 1. Sync semantic data
      const currentState = useDiagramStore.getState();
      
      // Prevent saving state if unmounted (race condition fix)
      if (!isMounted.current) {
          return;
      }

      const response = await diagramService.syncDiagramData(projectId, {
        actors: currentState.actors,
        useCases: currentState.useCases,
        relations: currentState.relations
      }, currentUserId);
      
      const idMappings = response?.data;
      let newPositions = { ...positions };
      
      if (idMappings && Object.keys(idMappings).length > 0) {
        useDiagramStore.getState().updateIds(idMappings);
        
        // Update keys in positions to match new IDs
        newPositions = {};
        for (const [key, value] of Object.entries(positions)) {
            let mappedKey = key;
            if (key.startsWith('uc_')) {
                const oldId = key.substring(3);
                if (idMappings[oldId]) mappedKey = `uc_${idMappings[oldId]}`;
            } else if (key.startsWith('actor_')) {
                const oldId = key.substring(6);
                if (idMappings[oldId]) mappedKey = idMappings[oldId];
                else if (idMappings[key]) mappedKey = idMappings[key];
            } else if (idMappings[key]) {
                mappedKey = idMappings[key];
            }
            newPositions[mappedKey] = value;
        }
      }
      
      // 2. Save layout data
      const layoutObj = {
          positions: newPositions,
          systemName: systemName
      };
      const payload = { layoutData: JSON.stringify(layoutObj) };
      if (base64Png) {
          payload.imageBase64 = base64Png;
      }
      await diagramService.saveDiagramLayout(projectId, payload, currentUserId);
      setSaveStatus('saved');
    } catch (error) {
      console.error("Failed to auto-save diagram", error);
      setSaveStatus('error');
    }
  }, [projectId, systemName, currentUserId]);

  const handleUnsavedChanges = useCallback(() => {
      setSaveStatus('unsaved');
  }, []);

  const startResizing = React.useCallback((e) => {
    setIsDragging(true);
    e.preventDefault(); // Prevent text selection
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  const resize = React.useCallback((e) => {
    if (isDragging && sidebarRef.current) {
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      let newWidth = e.clientX - sidebarRect.left;
      
      if (newWidth < 150) {
        setIsSidebarOpen(false);
        setIsDragging(false); // Snap shut and stop dragging
        setSidebarWidth(320); 
      } else {
        setIsSidebarOpen(true);
        if (newWidth > 600) newWidth = 600; 
        setSidebarWidth(newWidth);
      }
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isDragging, resize, stopResizing]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-gray-50 relative items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1E707D] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Diagram Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-gray-50 relative">
      {/* Sidebar - Only show in edit mode */}
      {!isViewMode && (
        <>
          <div 
            ref={sidebarRef}
            style={{ width: isSidebarOpen ? sidebarWidth : 0 }} 
            className={`h-full flex-shrink-0 overflow-hidden bg-white border-r border-gray-200 relative ${isDragging ? '' : 'transition-[width] duration-300 ease-in-out'}`}
          >
            <div style={{ width: isSidebarOpen ? sidebarWidth : 320 }} className="h-full">
              <DiagramSidePanel 
                projectId={projectId} 
                systemName={systemName} 
                setSystemName={setSystemName}
              />
            </div>
          </div>
          
          {/* Resizer Handle */}
          <div className="w-0 h-full relative z-10">
            <div 
              className="absolute top-0 bottom-0 -left-1.5 w-3 cursor-col-resize group flex flex-col justify-center items-center"
              onMouseDown={startResizing}
            >
              <div className={`w-[2px] h-full transition-colors ${isDragging ? 'bg-[#1E707D]' : 'bg-transparent group-hover:bg-[#1E707D]'}`} />
              
              {/* Toggle Button */}
              <button 
                onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
                className="absolute w-5 h-8 bg-white border border-gray-300 border-l-transparent rounded-r-md flex items-center justify-center -right-[15px] hover:bg-gray-100 shadow-sm cursor-pointer z-20"
              >
                <span className="material-symbols-outlined text-[16px] text-gray-600">
                  {isSidebarOpen ? 'chevron_left' : 'chevron_right'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden relative">
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button 
              onClick={!isViewMode && onView ? onView : onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title={!isViewMode ? "View Diagram" : "Back to List"}
              disabled={saveStatus === 'saving'}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1E707D]">
                {isViewMode ? 'visibility' : 'edit_document'}
              </span>
              {isViewMode ? 'Use Case Diagram (View Only)' : (activeView === 'mine' && currentUserId ? "Member's Diagram" : 'View Diagram')}
            </h1>
          </div>

          <div className="flex items-center gap-4 ml-3">
              <Button
                variant="outline"
                onClick={() => window.exportDiagramDrawio?.(systemName)}
                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 h-9"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export Draw.io
              </Button>
              {isViewMode ? (
              onEdit && (
                <Button
                  variant="primary"
                  onClick={onEdit}
                  className="h-9"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit Diagram
                </Button>
              )
            ) : (
              <div className={`flex items-center justify-center min-w-[150px] gap-2 px-4 h-9 rounded-md font-medium text-sm border 
                  ${saveStatus === 'saved' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                  ${saveStatus === 'unsaved' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                  ${saveStatus === 'saving' ? 'bg-[#1E707D]/10 text-[#1E707D] border-[#1E707D]/20' : ''}
                  ${saveStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200' : ''}
              `}>
                {saveStatus === 'saving' && (
                  <>
                    <span className="w-4 h-4 border-2 border-[#1E707D] border-t-transparent rounded-full animate-spin"></span>
                    Saving...
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Saved
                  </>
                )}
                {saveStatus === 'unsaved' && (
                  <>
                    <span className="material-symbols-outlined text-[18px]">pending</span>
                    Unsaved changes
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    Save Error
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Interactive Canvas */}
        <div className="flex-1 w-full h-full relative overflow-hidden bg-[#F8FAFC]">
          <UCDiagram 
            ref={diagramRef}
            key={projectId}
            projectId={projectId}
            actors={actors}
            useCases={useCases}
            relations={relations}
            systemName={systemName}
            mode={mode}
            onSystemNameLoad={setSystemName}
            onSave={!isViewMode ? handleDiagramSave : undefined}
            onUnsavedChanges={!isViewMode ? handleUnsavedChanges : undefined}
            isLeader={isLeader}
            onApproveUseCase={onApproveUseCase}
            onRejectUseCase={onRejectUseCase}
            activeView={activeView}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </div>
  );
};

export default UCDiagramEditorPage;
