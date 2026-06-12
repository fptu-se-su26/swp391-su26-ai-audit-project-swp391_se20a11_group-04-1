import React, { useEffect, useState, useCallback } from 'react';
import useDiagramStore from '../../../store/useDiagramStore';
import DiagramSidePanel from '../components/DiagramSidePanel';
import { UCDiagram } from '../components/UCDiagram';
import { diagramService } from '../services/diagramService';
import toast from 'react-hot-toast';

const UCDiagramEditorPage = ({ projectId, onClose }) => {
  const { actors, useCases, relations, loadData } = useDiagramStore();
  const [systemName, setSystemName] = useState("System");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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
    setSaving(true);
    try {
      // 1. Sync semantic data
      await diagramService.syncDiagramData(projectId, {
        actors,
        useCases,
        relations
      });
      
      // 2. Save layout data
      const payload = { layoutData: JSON.stringify(positions) };
      if (base64Png) {
          payload.imageBase64 = base64Png;
      }
      await diagramService.saveDiagramLayout(projectId, payload);
    } catch (error) {
      console.error("Failed to auto-save diagram", error);
    } finally {
      setSaving(false);
    }
  }, [projectId, actors, useCases, relations]);

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
      {/* Sidebar */}
      <DiagramSidePanel 
        projectId={projectId} 
        systemName={systemName} 
        setSystemName={setSystemName}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden relative">
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Back to Map"
              disabled={saving}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">edit_document</span>
              Use Case Diagram Editor
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 h-9 rounded-md bg-green-50 text-green-700 font-medium text-sm border border-green-200">
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Auto-saved
                </>
              )}
            </div>
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
            mode="edit"
            onSave={handleDiagramSave}
          />
        </div>
      </div>
    </div>
  );
};

export default UCDiagramEditorPage;
