import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  ReactFlowProvider,
  addEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import ActorNode from './nodes/ActorNode';
import UseCaseNode from './nodes/UseCaseNode';
import SystemBoundaryNode from './nodes/SystemBoundaryNode';
import { ucLayoutEngine } from '../utils/ucLayoutEngine';
import { diagramService } from '../services/diagramService';
import useDiagramStore from '../../../store/useDiagramStore';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reactFlowWrapper = useRef(null);
  
  const [history, setHistory] = useState([]);
  
  const { fitView, setCenter, project } = useReactFlow();
  const { addRelation, removeRelation, removeActor, removeUseCase, updateUseCase, updateActor } = useDiagramStore();

  const [selectedEdge, setSelectedEdge] = useState(null);
  const [edgePopupPos, setEdgePopupPos] = useState({ x: 0, y: 0 });

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const saveHistory = useCallback(() => {
    setHistory((prev) => [...prev, {
        nodes: nodes.map((n) => ({ ...n, position: { ...n.position } })),
        edges: [...edges]
    }]);
  }, [nodes, edges]);

  const onNodeDragStart = useCallback(() => {
    saveHistory();
  }, [saveHistory]);

  const handleUndo = () => {
    if (history.length > 0) {
        const prevState = history[history.length - 1];
        setNodes(prevState.nodes);
        setEdges(prevState.edges);
        setHistory((prev) => prev.slice(0, -1));
        
        // Cập nhật lại store (optional, tùy thuộc vào độ phức tạp, tạm thời chỉ undo vị trí trên canvas)
    }
  };

  const handleNodeDelete = (id) => {
      saveHistory();
      if (id.startsWith('uc_')) {
          const rawId = id.replace('uc_', '');
          updateUseCase(rawId, { showInDiagram: false });
      } else if (id.startsWith('actor_')) {
          const rawId = id.replace('actor_', '');
          removeActor(rawId);
      }
      setNodes((nds) => nds.filter(n => n.id !== id));
  };

  const handleNameUpdate = (id, newName) => {
      if (id.startsWith('uc_')) {
          const rawId = id.replace('uc_', '');
          updateUseCase(rawId, { name: newName });
      } else if (id.startsWith('actor_')) {
          const rawId = id.replace('actor_', '');
          updateActor(rawId, { name: newName });
      }
      setNodes((nds) => nds.map(n => n.id === id ? { ...n, data: { ...n.data, label: newName } } : n));
  };

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

      // Check which nodes are new (created in last 5 seconds)
      const isRecentlyCreated = (idStr) => idStr.includes(Date.now().toString().substring(0, 8));

      actors.forEach((a) => {
        const actorId = a.id.toString().startsWith('actor_') ? a.id.toString() : `actor_${a.id}`;
        initialNodes.push({
          id: actorId,
          type: 'actor',
          position: { x: 0, y: 0 },
          data: { 
              label: a.name || 'Actor', 
              side: a.side, 
              isNew: isRecentlyCreated(a.id.toString()),
              onDelete: handleNodeDelete,
              onNameUpdate: handleNameUpdate
          },
        });
      });

      useCases.forEach((uc) => {
        if (uc.showInDiagram === false) return; // Skip hidden UCs
        initialNodes.push({
          id: `uc_${uc.id}`,
          type: 'useCase',
          position: { x: 0, y: 0 },
          data: { 
              label: uc.name || 'Untitled', 
              group: uc.group, 
              isNew: isRecentlyCreated(uc.id.toString()),
              onDelete: handleNodeDelete,
              onNameUpdate: handleNameUpdate
          },
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
          type: rel.type,
          label: rel.type === 'include' ? '<<include>>' : rel.type === 'extend' ? '<<extend>>' : '',
        });
      });

      const { nodes: layoutedNodes, edges: layoutedEdges } = ucLayoutEngine(initialNodes, initialEdges, systemName);

      if (savedPositions && !forceReset) {
        const restoredNodes = layoutedNodes.map(node => {
           if (savedPositions[node.id]) {
               return { ...node, position: savedPositions[node.id] };
           }
           return node;
        });
        setNodes(restoredNodes);
        setEdges(layoutedEdges);
      } else {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      }

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

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if ((actors.length > 0 || useCases.length > 0) && !isInitialized) {
      initLayout();
      setIsInitialized(true);
    } else if (actors.length === 0 && useCases.length === 0) {
      setIsLoading(false);
    }
  }, [initLayout, actors.length, useCases.length, isInitialized]);

  // Unified Debounced Auto-save
  const autoSaveTimeout = useRef(null);

  useEffect(() => {
      if (!isInitialized || nodes.length === 0 || !onSave) return;
      
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
      
      autoSaveTimeout.current = setTimeout(async () => {
          const positions = {};
          nodes.forEach(n => { positions[n.id] = n.position; });
          
          let dataUrl = null;
          if (reactFlowWrapper.current) {
              try {
                  dataUrl = await toPng(reactFlowWrapper.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
              } catch(err) {
                  console.error("Failed to generate PNG", err);
              }
          }
          onSave(dataUrl, positions);
      }, 2500); // 2.5s debounce
      
      return () => clearTimeout(autoSaveTimeout.current);
  }, [nodes, edges, actors, useCases, relations, systemName, isInitialized, onSave]);

  useEffect(() => {
    setNodes((nds) => nds.map(node => {
      if (node.type === 'useCase') {
          const isConnectedToActor = (startId) => {
              const visited = new Set();
              const queue = [startId];
              while(queue.length > 0) {
                  const current = queue.shift();
                  if (current.startsWith('actor_')) return true;
                  visited.add(current);
                  
                  const connectedEdges = edges.filter(e => e.source === current || e.target === current);
                  for (const e of connectedEdges) {
                      const other = e.source === current ? e.target : e.source;
                      if (!visited.has(other)) {
                          if (other.startsWith('actor_')) return true;
                          queue.push(other);
                      }
                  }
              }
              return false;
          };

          const isolated = !isConnectedToActor(node.id);
          if (node.data.isIsolated !== isolated) {
              return { ...node, data: { ...node.data, isIsolated: isolated } };
          }
      }
      return node;
    }));
  }, [edges, setNodes]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    const positions = {};
    nodes.forEach(n => { positions[n.id] = n.position; });

    if (reactFlowWrapper.current) {
        try {
            const dataUrl = await toPng(reactFlowWrapper.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
            onSave(dataUrl, positions);
        } catch(err) {
            onSave(null, positions);
        }
    } else {
        onSave(null, positions);
    }
  }, [nodes, onSave]);

  useEffect(() => {
     window.handleDiagramSave = handleSave;
     window.focusDiagramNode = (nodeId) => {
         // nodes is a dependency, but we can access it through state if needed. 
         // Since it's in useEffect, we'll use a ref or just use the current nodes.
         const node = nodes.find(n => n.id === nodeId);
         if (node) {
             setCenter(node.position.x, node.position.y, { zoom: 1, duration: 800 });
         }
     };
     return () => {
         delete window.handleDiagramSave;
         delete window.focusDiagramNode;
     };
  }, [handleSave, nodes, setCenter]);

  const onConnect = useCallback((connection) => {
      const { source, target, sourceHandle, targetHandle } = connection;
      const isSourceActor = source.startsWith('actor_');
      const isTargetActor = target.startsWith('actor_');
      const isSourceUc = source.startsWith('uc_');
      const isTargetUc = target.startsWith('uc_');

      if (isSourceActor && isTargetActor) {
          toast.error("Không thể nối Actor với Actor");
          return;
      }
      
      // Ràng buộc: UC cô đơn (không có actor nối) không được nối Include/Extend
      const isUcIsolated = (ucId) => {
         const node = nodes.find(n => n.id === ucId);
         return node?.data?.isIsolated;
      };

      if (isSourceUc && isTargetUc) {
          const sourceNode = nodes.find(n => n.id === source);
          const targetNode = nodes.find(n => n.id === target);
          if (sourceNode?.data?.isIsolated && targetNode?.data?.isIsolated) {
              toast.error("Tuyệt đối không được nối Include/Extend giữa hai Use Case cô đơn!");
              return;
          }

          // Kiểm tra xem đã có đường nối giữa 2 UC này chưa (chặn trùng lặp)
          const existingEdge = edges.find(e => 
              (e.source === source && e.target === target) || 
              (e.source === target && e.target === source)
          );
          if (existingEdge) {
              toast.error("Đã tồn tại liên kết giữa 2 Use Case này");
              return;
          }

          saveHistory();
          const relId = Date.now().toString();
          const newRel = {
              id: relId,
              type: 'include',
              sourceId: source.replace('uc_', ''),
              targetId: target.replace('uc_', '')
          };
          addRelation(newRel);
          
          const newEdge = {
              id: `edge_${relId}`,
              source,
              target,
              sourceHandle,
              targetHandle,
              type: 'default',
              label: '<<include>>',
              markerEnd: { type: 'arrowclosed', width: 14, height: 14 },
          };
          setEdges(eds => addEdge(newEdge, eds));
      } else if ((isSourceActor && isTargetUc) || (isSourceUc && isTargetActor)) {
          const existingEdge = edges.find(e => 
              (e.source === source && e.target === target) || 
              (e.source === target && e.target === source)
          );
          if (existingEdge) {
              toast.error("Đã tồn tại liên kết giữa Actor và Use Case này");
              return;
          }
          saveHistory();
          const relId = Date.now().toString();
          const newRel = {
              id: relId,
              type: 'actor-uc',
              sourceId: isSourceActor ? source.replace('actor_', '') : target.replace('actor_', ''),
              targetId: isTargetUc ? target.replace('uc_', '') : source.replace('uc_', '')
          };
          addRelation(newRel);
          
          const newEdge = {
              id: `edge_${relId}`,
              source,
              target,
              sourceHandle,
              targetHandle,
              type: 'default',
              markerEnd: { type: 'arrowclosed', width: 14, height: 14 },
          };
          setEdges(eds => addEdge(newEdge, eds));
      }
  }, [edges, nodes, addRelation, saveHistory]);

  const onEdgesDelete = useCallback((edgesToDelete) => {
      saveHistory();
      edgesToDelete.forEach(edge => {
          // Only remove the relation from the store if the edge itself was selected for deletion.
          // If it's deleted as a side-effect of a node being hidden/deleted, keep the relation in the store
          // so it can be restored if the node is unhidden.
          if (edge.selected) {
              const relId = edge.id.replace('edge_', '');
              removeRelation(relId);
          }
      });
  }, [removeRelation, saveHistory]);

  const onNodesDelete = useCallback((nodesToDelete) => {
      saveHistory();
      nodesToDelete.forEach(node => {
          if (node.id.startsWith('uc_')) {
              updateUseCase(node.id.replace('uc_', ''), { showInDiagram: false });
          }
          else if (node.id.startsWith('actor_')) removeActor(node.id.replace('actor_', ''));
      });
  }, [updateUseCase, removeActor, saveHistory]);

  const onEdgeClick = (event, edge) => {
      if (mode === 'view') return;
      
      setSelectedEdge(edge);
      setEdgePopupPos({ x: event.clientX, y: event.clientY });
  };

  const handleEdgeAction = (action) => {
      if (!selectedEdge) return;
      saveHistory();
      const rawRelId = selectedEdge.id.replace('edge_', '');
      const existingRel = relations.find(r => r.id.toString() === rawRelId);
      
      if (action === 'delete') {
          removeRelation(rawRelId);
          setEdges(eds => eds.filter(e => e.id !== selectedEdge.id));
      } else if (action === 'toggleType' && existingRel) {
          const newType = existingRel.type === 'include' ? 'extend' : 'include';
          removeRelation(rawRelId);
          addRelation({ ...existingRel, type: newType });
          setEdges(eds => eds.map(e => e.id === selectedEdge.id ? { ...e, type: 'default', label: `<<${newType}>>` } : e));
      } else if (action === 'reverse' && existingRel) {
          removeRelation(rawRelId);
          addRelation({
              ...existingRel,
              sourceId: existingRel.targetId,
              targetId: existingRel.sourceId
          });
          setEdges(eds => eds.map(e => {
              if (e.id === selectedEdge.id) {
                  const sourceNode = nodes.find(n => n.id === selectedEdge.target);
                  const targetNode = nodes.find(n => n.id === selectedEdge.source);
                  
                  let sourceHandle = e.targetHandle;
                  let targetHandle = e.sourceHandle;
                  
                  if (sourceNode && targetNode) {
                      const sx = sourceNode.position.x;
                      const sy = sourceNode.position.y;
                      const tx = targetNode.position.x;
                      const ty = targetNode.position.y;
                      
                      if (sx + 50 < tx) {
                          sourceHandle = 'right-source';
                          targetHandle = 'left-target';
                      } else if (sx > tx + 50) {
                          sourceHandle = 'left-source';
                          targetHandle = 'right-target';
                      } else {
                          if (sy < ty) {
                              sourceHandle = 'bottom-source';
                              targetHandle = 'top-target';
                          } else {
                              sourceHandle = 'top-source';
                              targetHandle = 'bottom-target';
                          }
                      }
                  }
                  
                  return { ...e, source: selectedEdge.target, target: selectedEdge.source, sourceHandle, targetHandle };
              }
              return e;
          }));
      }
      setSelectedEdge(null);
  };

  const handleResetLayout = () => {
      saveHistory();
      initLayout(true);
      toast.success("Đã chạy Auto Layout!");
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
    <div className={`w-full h-full min-h-[600px] flex-1 bg-gray-50 relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`} ref={reactFlowWrapper}>
      {mode === 'edit' && (
         <div className="absolute top-4 right-4 z-10 flex gap-3">
             <button 
                onClick={() => {
                   saveHistory();
                   initLayout(true);
                   toast.success("Đã chạy Sắp xếp thông minh!");
                }}
                className="bg-white border border-gray-300 text-blue-600 px-3 py-2 rounded-md shadow-sm hover:bg-blue-50 flex items-center text-sm font-medium transition-colors"
                title="Sắp xếp thông minh (Auto Layout)"
            >
                <span className="material-symbols-outlined text-[18px] mr-1">auto_awesome</span>
                Tự động xếp
            </button>
            <button 
                onClick={() => {
                   if (!document.fullscreenElement) {
                       reactFlowWrapper.current?.requestFullscreen().catch(err => toast.error("Trình duyệt không hỗ trợ Fullscreen"));
                       setIsFullscreen(true);
                   } else {
                       document.exitFullscreen();
                       setIsFullscreen(false);
                   }
                }}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md shadow-sm hover:bg-gray-50 flex items-center text-sm font-medium transition-colors"
                title="Toàn màn hình"
            >
                <span className="material-symbols-outlined text-[18px]">
                   {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                </span>
            </button>
            <button 
                onClick={handleUndo}
                disabled={history.length === 0}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 flex items-center text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Hoàn tác thao tác cuối"
            >
                <span className="material-symbols-outlined text-[18px] mr-2">undo</span>
                Hoàn tác
            </button>
         </div>
      )}

      {selectedEdge && (
          <div 
             className="fixed bg-white border border-gray-200 shadow-xl rounded-lg p-1.5 flex gap-1 z-50 animate-fade-in"
             style={{ top: edgePopupPos.y + 10, left: edgePopupPos.x + 10 }}
             onMouseLeave={() => setSelectedEdge(null)}
          >
             {(selectedEdge.label === '<<include>>' || selectedEdge.label === '<<extend>>') && (
                 <>
                     <button onClick={() => handleEdgeAction('toggleType')} className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center font-bold font-mono text-[11px]" title="Đổi loại (Include/Extend)">
                        {selectedEdge.label}
                     </button>
                     <div className="w-[1px] bg-gray-200 mx-1"></div>
                     <button onClick={() => handleEdgeAction('reverse')} className="p-1.5 text-gray-700 hover:bg-gray-100 rounded flex items-center justify-center" title="Đảo chiều">
                        <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                     </button>
                     <div className="w-[1px] bg-gray-200 mx-1"></div>
                 </>
             )}
             <button onClick={() => handleEdgeAction('delete')} className="p-1.5 text-red-600 hover:bg-red-50 rounded flex items-center justify-center" title="Xóa dây nối">
                <span className="material-symbols-outlined text-[16px]">delete</span>
             </button>
          </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
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
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background color="#E2E8F0" gap={24} size={1} />
        {!isView && <Controls />}
      </ReactFlow>
    </div>
  );
};

export const UCDiagram = (props) => (
   <ReactFlowProvider>
      <FlowContent {...props} />
   </ReactFlowProvider>
);
