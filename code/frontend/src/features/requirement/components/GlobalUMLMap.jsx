import React, { useRef, useState, useEffect } from 'react';
import { diagramService } from '../services/diagramService';
import { UCDiagram } from './UCDiagram';
import toast from 'react-hot-toast';

const GlobalUMLMap = ({ projectId, onEditDiagram, systemName = "System" }) => {
  const wrapperRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data state
  const [actors, setActors] = useState([]);
  const [useCases, setUseCases] = useState([]);
  const [relations, setRelations] = useState([]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!projectId) return;
    
    const fetchDiagram = async () => {
      setLoading(true);
      try {
        const data = await diagramService.getDiagramData(projectId);
        if (data) {
          setActors(data.actors || []);
          setUseCases(data.useCases || []);
          setRelations(data.relations || []);
        }
      } catch (error) {
        console.error("Failed to load diagram data", error);
        toast.error("Failed to load diagram data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDiagram();
  }, [projectId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (wrapperRef.current) {
        wrapperRef.current.requestFullscreen().catch(err => {
          toast.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else {
      document.exitFullscreen();
    }
  };

  const handleExport = async (format) => {
    // In view mode, we can just trigger the same save logic if we implement a global export
    toast("Image export is better done from Edit Diagram for high resolution.", { icon: "ℹ️" });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-gray-200 min-h-[500px]">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium animate-pulse">Loading diagram data...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={`flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col relative ${isFullscreen ? 'h-screen w-screen rounded-none' : 'h-[600px]'}`}>
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center z-10 relative shadow-sm">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">schema</span>
          Global Use Case Diagram
        </h3>

        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 hidden sm:inline">Use mouse scroll to pan/zoom.</span>
          
          {onEditDiagram && (
            <button 
              onClick={onEditDiagram}
              className="flex items-center justify-center h-8 px-3 rounded bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px] mr-1">edit</span>
              <span className="text-[13px] font-medium hidden sm:inline">Edit Diagram</span>
            </button>
          )}

          <button 
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-8 h-8 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
         <UCDiagram
            projectId={projectId}
            actors={actors}
            useCases={useCases}
            relations={relations}
            systemName={systemName}
            mode="view"
         />
      </div>
    </div>
  );
};

export default GlobalUMLMap;
