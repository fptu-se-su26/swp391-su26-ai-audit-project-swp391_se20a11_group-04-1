import React, { useEffect, useState, useCallback, useRef } from 'react';
import useDiagramStore from '../../../store/useDiagramStore';
import DiagramSidePanel from '../components/DiagramSidePanel';
import { UCDiagram } from '../components/UCDiagram';
import { diagramService } from '../services/diagramService';
import { requirementApi } from '../services/requirementApi';
import toast from 'react-hot-toast';

const UCDiagramEditorPage = ({ projectId, mode = 'edit', onClose, onEdit }) => {
  const { actors, useCases, relations, loadData, reset } = useDiagramStore();
  const [systemName, setSystemName] = useState("System");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'unsaved', 'saving', 'error'
  const diagramRef = useRef(null);
  
  const isViewMode = mode === 'view';
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

        const data = await diagramService.getDiagramData(projectId);
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
      reset();
    };
  }, [projectId, loadData, reset]);

  const handleDiagramSave = useCallback(async (base64Png, positions) => {
    if (!projectId) return;
    setSaveStatus('saving');
    try {
      // 1. Sync semantic data
      const currentState = useDiagramStore.getState();
      
      // Prevent saving empty state if unmounted (race condition fix)
      if (currentState.actors.length === 0 && currentState.useCases.length === 0) {
          setSaveStatus('saved');
          return;
      }

      const response = await diagramService.syncDiagramData(projectId, {
        actors: currentState.actors,
        useCases: currentState.useCases,
        relations: currentState.relations
      });
      
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
      await diagramService.saveDiagramLayout(projectId, payload);
      setSaveStatus('saved');
    } catch (error) {
      console.error("Failed to auto-save diagram", error);
      setSaveStatus('error');
    }
  }, [projectId, systemName]);

  const handleUnsavedChanges = useCallback(() => {
      setSaveStatus('unsaved');
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-gray-50 relative items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Diagram Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-gray-50 relative">
      {/* Sidebar - Only show in edit mode */}
      {!isViewMode && (
        <DiagramSidePanel 
          projectId={projectId} 
          systemName={systemName} 
          setSystemName={setSystemName}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden relative">
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Back to Map"
              disabled={saveStatus === 'saving'}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">
                {isViewMode ? 'visibility' : 'edit_document'}
              </span>
              Use Case Diagram {isViewMode ? '(View Only)' : 'Editor'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
              <button
                onClick={() => window.exportDiagramDrawio?.(systemName)}
                className="flex items-center gap-2 px-4 h-9 rounded-md font-medium text-sm border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export Draw.io
              </button>
              {isViewMode ? (
              onEdit && (
                <button
                  onClick={onEdit}
                  className="flex items-center gap-2 px-4 h-9 rounded-md font-medium text-sm border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit Diagram
                </button>
              )
            ) : (
              <div className={`flex items-center justify-center min-w-[150px] gap-2 px-4 h-9 rounded-md font-medium text-sm border 
                  ${saveStatus === 'saved' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                  ${saveStatus === 'unsaved' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                  ${saveStatus === 'saving' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                  ${saveStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200' : ''}
              `}>
                {saveStatus === 'saving' && (
                  <>
                    <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
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
          />
        </div>
      </div>
    </div>
  );
};

export default UCDiagramEditorPage;
