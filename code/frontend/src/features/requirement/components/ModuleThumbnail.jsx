import React, { useState, useEffect } from 'react';
import { diagramService } from '../services/diagramService';

const ModuleThumbnail = ({ projectId, moduleId }) => {
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchLayout = async () => {
      try {
        const layoutData = await diagramService.getDiagramLayout(projectId, moduleId);
        if (isMounted && layoutData && layoutData.imageBase64) {
          setImageBase64(layoutData.imageBase64);
        }
      } catch (err) {
        console.warn("Failed to load thumbnail for module", moduleId);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLayout();
    return () => { isMounted = false; };
  }, [projectId, moduleId]);

  if (loading) {
    return (
      <div className="w-full h-28 bg-gray-50/50 animate-pulse flex items-center justify-center">
        <span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">Loading Preview...</span>
      </div>
    );
  }

  if (!imageBase64) {
    return (
      <div className="w-full h-28 bg-gray-50/30 flex items-center justify-center border-t border-gray-100">
        <div className="flex flex-col items-center opacity-40">
          <span className="material-symbols-outlined text-[24px] mb-1">image_not_supported</span>
          <span className="text-[10px] font-medium uppercase tracking-wider">No Preview</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-28 border-t border-gray-100 bg-white overflow-hidden relative group-hover/card:bg-gray-50/50 transition-colors flex items-center justify-center">
      <img 
        src={imageBase64} 
        alt="Diagram Preview" 
        className="max-w-full max-h-full object-contain p-2 filter opacity-90 group-hover/card:opacity-100 group-hover/card:scale-105 transition-transform duration-500 origin-center"
      />
    </div>
  );
};

export default ModuleThumbnail;
