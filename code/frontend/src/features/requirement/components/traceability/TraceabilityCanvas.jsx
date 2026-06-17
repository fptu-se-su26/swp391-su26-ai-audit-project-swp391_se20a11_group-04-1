import { useState, useRef, useEffect, useCallback } from 'react';
import { useTraceability } from './TraceabilityContext';
import TraceabilityConnectorLayer from './TraceabilityConnectorLayer';
import TraceabilityNodeCard from './TraceabilityNodeCard';
import HubNode from './HubNode';
import TraceabilityToolbar from './TraceabilityToolbar';

const ExpandToggle = ({ isExpanded, onClick, remainingCount, label }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors z-10 relative flex items-center gap-2"
  >
    {isExpanded ? `Thu gọn ${label}` : `+ Xem thêm ${remainingCount} ${label}`}
  </button>
);

const TaskSubTree = ({ task, allEvidence }) => {
  const taskEvidences = allEvidence.filter(e => 
    e.evidenceLinks && Array.isArray(e.evidenceLinks) && e.evidenceLinks.some(l => l.entityType?.toUpperCase() === 'TASK' && String(l.entityId) === String(task.id))
  );

  return (
    <div className="relative z-10 shrink-0 w-full">
      <TraceabilityNodeCard level="Tasks" item={task} taskEvidences={taskEvidences} />
    </div>
  );
};

const TraceabilityCanvas = () => {
  const { canvasRef, requirement, data, measureLayout } = useTraceability();
  
  // Pan and Zoom State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Collapse States for Main Branches
  const [ucExpanded, setUcExpanded] = useState(false);
  const [taskExpanded, setTaskExpanded] = useState(false);
  const [testExpanded, setTestExpanded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(measureLayout, 50);
    return () => clearTimeout(timer);
  }, [ucExpanded, taskExpanded, testExpanded, measureLayout]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.3));
  const handleFitView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY * -0.001;
      setZoom(z => Math.max(0.3, Math.min(2, z + delta)));
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }, []);

  const handleMouseDown = (e) => {
    // Prevent drag if clicking on a button or a clickable card
    if (e.target.closest('button') || e.target.closest('.cursor-pointer')) {
      return;
    }
    
    // Allow drag on left click (0) or middle click (1)
    if (e.button === 0 || e.button === 1) {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      document.body.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
    }
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      if (canvas) canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleWheel, handleMouseUp, handleMouseMove, canvasRef]);

  // Background dotted grid configuration
  const gridStyle = {
    backgroundImage: `radial-gradient(#CBD5E1 1.5px, transparent 1.5px)`,
    backgroundSize: `32px 32px`,
    backgroundPosition: `${pan.x}px ${pan.y}px`,
  };

  const useCases = data['Use Cases'] || [];
  const tasks = data['Tasks'] || [];
  const tests = data['Tests'] || [];
  const evidences = data['Evidence'] || [];

  // Collapse States are handled above

  const ucDisplayCount = 3;
  const taskDisplayCount = 3;
  const testDisplayCount = 3;

  const displayedUcs = ucExpanded ? useCases : useCases.slice(0, ucDisplayCount);
  const displayedTasks = taskExpanded ? tasks : tasks.slice(0, taskDisplayCount);
  const displayedTests = testExpanded ? tests : tests.slice(0, testDisplayCount);

  return (
    <div 
      className="relative w-full h-full overflow-hidden bg-[#f8fafc] select-none"
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      style={gridStyle}
    >
      <TraceabilityToolbar 
        zoom={zoom} 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut} 
        onReset={handleFitView} 
      />

      <div 
        id="canvas-inner"
        className="absolute inset-0 origin-center transition-transform duration-75 ease-out"
        style={{ 
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          willChange: 'transform'
        }}
      >
        <TraceabilityConnectorLayer />
        
        <div className="flex flex-col items-center py-16 min-h-max w-max mx-auto px-[10vw]">
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Root Node */}
            <TraceabilityNodeCard level="Requirement" item={requirement} />
          </div>

          {/* Level 1 Split: 3 Branches Side-by-Side */}
          <div className="flex gap-40 mt-20 items-start">
            
            {/* Branch 1: Use Cases (Vertical Spine) */}
            <div className="flex flex-col items-start gap-8 relative z-10 shrink-0 w-[350px]">
              <HubNode level="Use Cases" colorClass="text-cyan-600" shadowClass="" label="Use Cases" />
              
              <div className="flex flex-col gap-6 pl-[80px] w-full">
                {useCases.length === 0 ? (
                  <TraceabilityNodeCard level="Use Cases" isEmpty />
                ) : (
                  displayedUcs.map(item => <TraceabilityNodeCard key={item.id} level="Use Cases" item={item} />)
                )}

                {useCases.length > ucDisplayCount && (
                  <ExpandToggle 
                    isExpanded={ucExpanded} 
                    onClick={() => setUcExpanded(!ucExpanded)} 
                    remainingCount={useCases.length - ucDisplayCount}
                    label="Use Cases"
                  />
                )}
              </div>
            </div>

            {/* Branch 2: Tasks (Vertical Spine with Nested Evidence) */}
            <div className="flex flex-col items-start gap-8 relative z-10 shrink-0 w-[400px]">
              <HubNode level="Tasks" colorClass="text-amber-600" shadowClass="" label="Tasks" />
              
              <div className="flex flex-col gap-12 pl-[80px] w-full">
                {tasks.length === 0 ? (
                  <TraceabilityNodeCard level="Tasks" isEmpty />
                ) : (
                  displayedTasks.map(task => (
                    <TaskSubTree key={task.id} task={task} allEvidence={evidences} />
                  ))
                )}

                {tasks.length > taskDisplayCount && (
                  <ExpandToggle 
                    isExpanded={taskExpanded} 
                    onClick={() => setTaskExpanded(!taskExpanded)} 
                    remainingCount={tasks.length - taskDisplayCount}
                    label="Tasks"
                  />
                )}
              </div>
            </div>

            {/* Branch 3: Tests (Vertical Spine) */}
            <div className="flex flex-col items-start gap-8 relative z-10 shrink-0 w-[350px]">
              <HubNode level="Tests" colorClass="text-emerald-600" shadowClass="" label="Tests" />
              
              <div className="flex flex-col gap-6 pl-[80px] w-full">
                {tests.length === 0 ? (
                  <TraceabilityNodeCard level="Tests" isEmpty />
                ) : (
                  displayedTests.map(item => <TraceabilityNodeCard key={item.id} level="Tests" item={item} />)
                )}

                {tests.length > testDisplayCount && (
                  <ExpandToggle 
                    isExpanded={testExpanded} 
                    onClick={() => setTestExpanded(!testExpanded)} 
                    remainingCount={tests.length - testDisplayCount}
                    label="Tests"
                  />
                )}
              </div>
            </div>

          </div>
          
        </div>
      </div>
    </div>
  );
};

export default TraceabilityCanvas;
