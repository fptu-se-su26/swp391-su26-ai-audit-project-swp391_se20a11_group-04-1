import React, { useRef, useState, useEffect } from 'react';
import { useGlobalUMLMap } from '../hooks/useGlobalUMLMap';
import toast from 'react-hot-toast';

const GlobalUMLMap = ({ projectId }) => {
  const wrapperRef = useRef(null);
  const imageContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { imgUrl, loading } = useGlobalUMLMap(projectId);

  // Zoom state
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Reset zoom on fullscreen toggle
      setScale(1);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle Ctrl+Wheel to zoom
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const zoomSensitivity = 0.05;
        const delta = e.deltaY > 0 ? -zoomSensitivity : zoomSensitivity;
        setScale(prev => Math.min(Math.max(0.2, prev + delta), 4));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [imgUrl]); 

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

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 4));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.2));
  const resetZoom = () => {
    setScale(1);
  };

  const handleExport = async (format) => {
    const exportUrl = format === 'png' ? imgUrl.replace('/svg/', '/png/') : imgUrl;
    try {
      const toastId = toast.loading(`Preparing ${format.toUpperCase()} export...`);
      const response = await fetch(exportUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `use-case-diagram.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success(`Exported successfully!`, { id: toastId });
    } catch (error) {
      console.warn('CORS prevented direct download, opening in new tab instead.');
      window.open(exportUrl, '_blank');
      toast.dismiss();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-gray-200 min-h-[500px]">
        <div className="flex flex-col items-center">
          <span className="material-symbols-outlined animate-spin text-primary text-[32px] mb-2">progress_activity</span>
          <span className="text-gray-600 font-medium">Drawing Global UML Map...</span>
        </div>
      </div>
    );
  }

  if (!imgUrl) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-gray-200 min-h-[500px] flex-col">
        <span className="material-symbols-outlined text-gray-400 text-[48px] mb-2">map</span>
        <span className="text-gray-500">No Use Cases found to generate map.</span>
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
        
        {/* Zoom Controls */}
        <div className="flex items-center bg-white rounded-lg overflow-hidden border border-gray-300 mx-4 shadow-sm">
          <button onClick={zoomOut} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors" title="Zoom Out">
            <span className="material-symbols-outlined text-[18px]">zoom_out</span>
          </button>
          <div className="px-3 py-1.5 text-gray-700 text-[13px] font-medium border-x border-gray-300 bg-gray-50 min-w-[60px] text-center" title="Ctrl + Wheel to zoom">
            {Math.round(scale * 100)}%
          </div>
          <button onClick={zoomIn} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors" title="Zoom In">
            <span className="material-symbols-outlined text-[18px]">zoom_in</span>
          </button>
          <button onClick={resetZoom} className="px-3 py-1.5 text-blue-600 hover:bg-gray-100 transition-colors border-l border-gray-300" title="Reset View">
            <span className="material-symbols-outlined text-[18px]">filter_center_focus</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 hidden sm:inline">Use mouse scroll to pan, Ctrl+Scroll to zoom.</span>
          
          <div className="relative group">
            <button 
              className="flex items-center justify-center h-8 px-3 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px] mr-1">download</span>
              <span className="text-[13px] font-medium hidden sm:inline">Export</span>
            </button>
            <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
              <button 
                onClick={() => handleExport('png')}
                className="w-full flex items-center px-4 py-2 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-100"
              >
                <span className="material-symbols-outlined text-[16px] mr-2">image</span>
                Export as PNG
              </button>
              <button 
                onClick={() => handleExport('svg')}
                className="w-full flex items-center px-4 py-2 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] mr-2">polyline</span>
                Export as SVG
              </button>
            </div>
          </div>

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
      
      <div 
        ref={imageContainerRef}
        className="flex-1 overflow-auto bg-[#F8FAFC] relative"
      >
        <div className="min-w-full min-h-full flex items-center justify-center p-8">
          <img 
            src={imgUrl} 
            alt="PlantUML Use Case Diagram" 
            style={{ 
              width: `${scale * 100}%`, 
              height: 'auto',
              maxWidth: 'none',
              transition: 'width 0.1s ease-out'
            }}
            className="shadow-xl bg-white rounded-lg p-6 border border-gray-200" 
            draggable="false"
          />
        </div>
      </div>
    </div>
  );
};

export default GlobalUMLMap;
