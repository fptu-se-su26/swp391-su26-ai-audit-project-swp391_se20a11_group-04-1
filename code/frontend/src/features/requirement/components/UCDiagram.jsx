import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import ActorNode from './nodes/ActorNode';
import UseCaseNode from './nodes/UseCaseNode';
import SystemBoundaryNode from './nodes/SystemBoundaryNode';
import { ucLayoutEngine } from '../utils/ucLayoutEngine';
import { diagramService } from '../services/diagramService';
import toast from 'react-hot-toast';

const nodeTypes = {
  actor: ActorNode,
  useCase: UseCaseNode,
  systemBoundary: SystemBoundaryNode
};

const FlowContent = ({ projectId, actors = [], useCases = [], relations = [], systemName, mode, onSave }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const reactFlowWrapper = useRef(null);
  
  const [history, setHistory] = useState([]);
  
  const { fitView } = useReactFlow();

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onNodeDragStart = useCallback(() => {
    // Save current positions to history before dragging starts
    setHistory((prev) => [...prev, nodes.map((n) => ({ ...n, position: { ...n.position } }))]);
  }, [nodes]);

  const initLayout = useCallback(async (forceReset = false) => {
    setIsLoading(true);
    
    try {
      let initialNodes = [];
      let initialEdges = [];

      let savedPositions = null;
      if (projectId && !forceReset) {
          const data = await diagramService.getDiagramLayout(projectId);
          if (data && data.layoutData) {
             savedPositions = JSON.parse(data.layoutData);
          }
      }

      actors.forEach((a) => {
        const actorId = a.id.toString().startsWith('actor_') ? a.id.toString() : `actor_${a.id}`;
        let side = a.side;
        if (savedPositions && savedPositions[actorId]) {
            if (savedPositions[actorId].x < 400) side = 'left';
            else if (savedPositions[actorId].x > 900) side = 'right';
            else side = 'bottom';
        }
        initialNodes.push({
          id: actorId,
          type: 'actor',
          position: { x: 0, y: 0 },
          data: { label: a.name || 'Actor', side: side },
        });
      });

      useCases.forEach((uc) => {
        initialNodes.push({
          id: `uc_${uc.id}`,
          type: 'useCase',
          position: { x: 0, y: 0 },
          data: { label: uc.name || 'Untitled', group: uc.group },
        });
      });

      relations.forEach((rel) => {
        const sourceStr = rel.sourceId.toString();
        const targetStr = rel.targetId.toString();
        
        const isSourceActor = sourceStr.startsWith('actor_') || actors.some(a => a.id.toString() === sourceStr);
        const isTargetActor = targetStr.startsWith('actor_') || actors.some(a => a.id.toString() === targetStr);
        
        const source = isSourceActor ? (sourceStr.startsWith('actor_') ? sourceStr : `actor_${sourceStr}`) : `uc_${sourceStr}`;
        const target = isTargetActor ? (targetStr.startsWith('actor_') ? targetStr : `actor_${targetStr}`) : `uc_${targetStr}`;

        initialEdges.push({
          id: `edge_${rel.id}`,
          source,
          target,
          type: rel.type, // passed to engine
          label: rel.type === 'include' ? '<<include>>' : rel.type === 'extend' ? '<<extend>>' : '',
        });
      });

      // Generate layout synchronously
      const { nodes: layoutedNodes, edges: layoutedEdges } = ucLayoutEngine(initialNodes, initialEdges, systemName);

      if (savedPositions && !forceReset) {
        // Apply saved positions if they exist
        const restoredNodes = layoutedNodes.map(node => {
           if (savedPositions[node.id]) {
               return { ...node, position: savedPositions[node.id] };
           }
           return node;
        });
        setNodes(restoredNodes);
        setEdges(layoutedEdges);
      } else {
        // Use custom layout positions
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      }

      // Show warning if huge diagram
      if (useCases.length > 30 && forceReset) {
         toast("Diagram có nhiều Use Cases, hãy zoom out để xem toàn bộ", { icon: "ℹ️" });
      }

      // Auto-fit after render
      setTimeout(() => {
        fitView({ padding: 0.08, minZoom: 0.1 });
      }, 100);

    } catch (error) {
      console.error("Failed to load layout", error);
      toast.error("Failed to load layout");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, actors, useCases, relations, systemName, fitView]);

  useEffect(() => {
    if (actors.length > 0 || useCases.length > 0) {
      initLayout();
    } else {
      setIsLoading(false);
    }
  }, [initLayout, actors.length, useCases.length]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    
    const positions = {};
    nodes.forEach(n => {
        positions[n.id] = n.position;
    });

    if (reactFlowWrapper.current) {
        try {
            const dataUrl = await toPng(reactFlowWrapper.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
            onSave(dataUrl, positions);
        } catch(err) {
            console.error("Failed to export png", err);
            onSave(null, positions);
        }
    } else {
        onSave(null, positions);
    }
  }, [nodes, onSave]);

  useEffect(() => {
     window.handleDiagramSave = handleSave;
     return () => delete window.handleDiagramSave;
  }, [handleSave]);

  const handleResetLayout = () => {
      // Save history before resetting
      setHistory((prev) => [...prev, nodes.map((n) => ({ ...n, position: { ...n.position } }))]);
      initLayout(true);
      toast.success("Đã chạy Auto Layout!");
  };

  const handleUndo = () => {
      if (history.length > 0) {
          const prevNodes = history[history.length - 1];
          setNodes(prevNodes);
          setHistory((prev) => prev.slice(0, -1));
      }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 h-full w-full min-h-[500px]">
         <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
         <p className="mt-4 text-gray-600 font-medium">Đang tính toán sơ đồ...</p>
      </div>
    );
  }

  const isView = mode === 'view';

  return (
    <div className="w-full h-full min-h-[600px] flex-1 bg-gray-50 relative" ref={reactFlowWrapper}>
      {mode === 'edit' && (
         <div className="absolute top-4 right-4 z-10 flex gap-3">
            <button 
                onClick={handleUndo}
                disabled={history.length === 0}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 flex items-center text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Hoàn tác thao tác cuối"
            >
                <span className="material-symbols-outlined text-[18px] mr-2">undo</span>
                Hoàn tác
            </button>
            <button 
                onClick={handleResetLayout}
                className="bg-white border border-gray-300 text-blue-600 px-4 py-2 rounded-md shadow-sm hover:bg-blue-50 flex items-center text-sm font-medium transition-colors"
                title="Tự động sắp xếp lại toàn bộ sơ đồ"
            >
                <span className="material-symbols-outlined text-[18px] mr-2">auto_awesome</span>
                Auto Layout
            </button>
         </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={onNodeDragStart}
        nodeTypes={nodeTypes}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        nodesDraggable={!isView}
        nodesConnectable={!isView}
        elementsSelectable={!isView}
        panOnDrag={true}
        zoomOnScroll={true}
      >
        <Background color="#E2E8F0" gap={24} size={1} />
        {!isView && <Controls />}
        {!isView && <MiniMap nodeColor={(n) => {
            if (n.type === 'actor') return '#2E86AB';
            if (n.type === 'useCase') return '#4A90D9';
            if (n.type === 'systemBoundary') return 'transparent';
            return '#eee';
        }} />}
      </ReactFlow>
    </div>
  );
};

export const UCDiagram = (props) => (
   <ReactFlowProvider>
      <FlowContent {...props} />
   </ReactFlowProvider>
);
