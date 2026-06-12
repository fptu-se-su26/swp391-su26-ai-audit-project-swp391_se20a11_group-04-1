import React, { useEffect, useState, useCallback } from 'react';
import useDiagramStore from '../../../store/useDiagramStore';
import DiagramSidePanel from '../components/DiagramSidePanel';
import { UCDiagram } from '../components/UCDiagram';
import { diagramService } from '../services/diagramService';
import toast from 'react-hot-toast';

const UCDiagramEditorPage = ({ projectId, mode = 'edit', onClose, onEdit }) => {
  const { actors, useCases, relations, loadData } = useDiagramStore();
  const [systemName, setSystemName] = useState("System");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'unsaved', 'saving', 'error'
  
  const isViewMode = mode === 'view';
  useEffect(() => {
    if (!projectId) return;
    
    const fetchDiagram = async () => {
      setLoading(true);
      try {
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
  }, [projectId, loadData]);

  const handleDiagramSave = useCallback(async (base64Png, positions) => {
    if (!projectId) return;
    setSaveStatus('saving');
    try {
      // 1. Sync semantic data
      const currentState = useDiagramStore.getState();
      await diagramService.syncDiagramData(projectId, {
        actors: currentState.actors,
        useCases: currentState.useCases,
        relations: currentState.relations
      });
      
      // 2. Save layout data
      const payload = { layoutData: JSON.stringify(positions) };
      if (base64Png) {
          payload.imageBase64 = base64Png;
      }
      await diagramService.saveDiagramLayout(projectId, payload);
      setSaveStatus('saved');
    } catch (error) {
      console.error("Failed to auto-save diagram", error);
      setSaveStatus('error');
    }
  }, [projectId]);

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
              <div className={`flex items-center gap-2 px-4 h-9 rounded-md font-medium text-sm border 
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
            projectId={projectId}
            actors={actors}
            useCases={useCases}
            relations={relations}
            systemName={systemName}
            mode={mode}
            onSave={!isViewMode ? handleDiagramSave : undefined}
            onUnsavedChanges={!isViewMode ? handleUnsavedChanges : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default UCDiagramEditorPage;
