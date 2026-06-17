import React, { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { exportToDrawio } from '../utils/drawioExporter';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
  ConnectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import ActorNode from './nodes/ActorNode';
import UseCaseNode from './nodes/UseCaseNode';
import SystemBoundaryNode from './nodes/SystemBoundaryNode';
import CustomEdge from './edges/CustomEdge';
import { ucLayoutEngine } from '../utils/ucLayoutEngine';
import { diagramService } from '../services/diagramService';
import useDiagramStore from '../../../store/useDiagramStore';
import toast from 'react-hot-toast';

const nodeTypes = {
  actor: ActorNode,
  useCase: UseCaseNode,
  systemBoundary: SystemBoundaryNode
};

const edgeTypes = {
  custom: CustomEdge
};

const calculateDynamicHandles = (edges, nodes) => {
    return edges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode) return edge;

        const sx = sourceNode.position.x;
        const sy = sourceNode.position.y;
        const tx = targetNode.position.x;
        const ty = targetNode.position.y;
        
        const isSourceActor = edge.source.startsWith('actor_');
        const isTargetActor = edge.target.startsWith('actor_');
        
        let newSourceHandle, newTargetHandle;
        
        if (isSourceActor || isTargetActor) {
            if (sx < tx) {
                newSourceHandle = 'right';
                newTargetHandle = 'left';
            } else {
                newSourceHandle = 'left';
                newTargetHandle = 'right';
            }
        } else {
            if (sx + 50 < tx) {
                newSourceHandle = 'right';
                newTargetHandle = 'left';
            } else if (sx > tx + 50) {
                newSourceHandle = 'left';
                newTargetHandle = 'right';
            } else {
                if (sy < ty) {
                    newSourceHandle = 'bottom';
                    newTargetHandle = 'top';
                } else {
                    newSourceHandle = 'top';
                    newTargetHandle = 'bottom';
                }
            }
        }
        
        if (edge.sourceHandle === newSourceHandle && edge.targetHandle === newTargetHandle) {
            return edge;
        }
        
        return { ...edge, sourceHandle: newSourceHandle, targetHandle: newTargetHandle };
    });
};

const FlowContent = forwardRef(({ projectId, actors = [], useCases = [], relations = [], systemName, mode, onSave, onUnsavedChanges, onSystemNameLoad }, ref) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reactFlowWrapper = useRef(null);
  
  const { fitView, setCenter, project, getNodes, getEdges } = useReactFlow();
  
  useImperativeHandle(ref, () => ({
    exportDrawio: (diagramName) => {
      exportToDrawio(getNodes(), getEdges(), diagramName);
    }
  }), [getNodes, getEdges]);

  const [history, setHistory] = useState([]);

  const { addRelation, removeRelation, updateRelation, removeActor, removeUseCase, updateUseCase, updateActor, idMappings } = useDiagramStore();

  useEffect(() => {
    if (idMappings && Object.keys(idMappings).length > 0) {
        setNodes(nds => nds.map(n => {
            let mappedKey = n.id;
            if (n.id.startsWith('uc_')) {
                const oldId = n.id.substring(3);
                if (idMappings[oldId]) mappedKey = `uc_${idMappings[oldId]}`;
            } else if (n.id.startsWith('actor_')) {
                const oldId = n.id.substring(6);
                if (idMappings[oldId]) mappedKey = idMappings[oldId];
                else if (idMappings[n.id]) mappedKey = idMappings[n.id];
            } else if (idMappings[n.id]) {
                mappedKey = idMappings[n.id];
            }
            return n.id !== mappedKey ? { ...n, id: mappedKey } : n;
        }));

        setEdges(eds => eds.map(e => {
            const mapId = (id) => {
                if (id.startsWith('uc_')) {
                    const oldId = id.substring(3);
                    if (idMappings[oldId]) return `uc_${idMappings[oldId]}`;
                } else if (id.startsWith('actor_')) {
                    const oldId = id.substring(6);
                    if (idMappings[oldId]) return idMappings[oldId];
                    else if (idMappings[id]) return idMappings[id];
                } else if (idMappings[id]) {
                    return idMappings[id];
                }
                return id;
            };
            const s = mapId(e.source);
            const t = mapId(e.target);
            return (s !== e.source || t !== e.target) ? { ...e, source: s, target: t, id: e.id.replace(e.source, s).replace(e.target, t) } : e;
        }));
    }
  }, [idMappings, setNodes, setEdges]);

  // Update system boundary label when systemName prop changes
  useEffect(() => {
    if (systemName) {
        setNodes((nds) => nds.map(node => {
            if (node.id === 'system_boundary') {
                return { ...node, data: { ...node.data, label: systemName } };
            }
            return node;
        }));
    }
  }, [systemName, setNodes]);

  const [selectedEdge, setSelectedEdge] = useState(null);
  const [edgePopupPos, setEdgePopupPos] = useState({ x: 0, y: 0 });

  const onNodesChange = useCallback(
    (changes) => {
        setNodes((nds) => {
            const updatedNodes = applyNodeChanges(changes, nds);
            const isPositionChange = changes.some(c => c.type === 'position');
            if (isPositionChange) {
                setEdges(eds => calculateDynamicHandles(eds, updatedNodes));
            }
            return updatedNodes;
        });
        const isSignificant = changes.some(c => c.type !== 'dimensions' && c.type !== 'select');
        if (isSignificant && onUnsavedChanges) onUnsavedChanges();
    },
    [onUnsavedChanges, setEdges]
  );
  
  const onEdgesChange = useCallback(
    (changes) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));
        const isSignificant = changes.some(c => c.type !== 'select');
        if (isSignificant && onUnsavedChanges) onUnsavedChanges();
    },
    [onUnsavedChanges]
  );

  const saveHistory = useCallback(() => {
    const store = useDiagramStore.getState();
    setHistory((prev) => [...prev.slice(-49), { // BUG 10 FIX: Limit to 50 items
        nodes: nodes.map((n) => ({ ...n, position: { ...n.position } })),
        edges: [...edges],
        actors: [...store.actors], // BUG 6 FIX: Capture store state
        useCases: [...store.useCases],
        relations: [...store.relations]
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
        
        setTimeout(() => {
            fitView({ padding: 0.2, duration: 800 });
        }, 50);
        
        // BUG 6 FIX: Sync store back to match undo state
        const store = useDiagramStore.getState();
        store.loadData({
            actors: prevState.actors,
            useCases: prevState.useCases,
            relations: prevState.relations
        });
    }
  };

  const handleNodeDelete = useCallback((id) => {
      saveHistory();
      if (id.startsWith('uc_')) {
          const rawId = id.replace('uc_', '');
          updateUseCase(rawId, { showInDiagram: false });
      } else if (id.startsWith('actor_')) {
          const rawId = id.replace('actor_', '');
          removeActor(rawId);
      }
      setNodes((nds) => nds.filter(n => n.id !== id));
  }, [saveHistory, updateUseCase, removeActor, setNodes]);

  const handleNameUpdate = useCallback((id, newName) => {
      if (id.startsWith('uc_')) {
          const rawId = id.replace('uc_', '');
          updateUseCase(rawId, { name: newName });
      } else if (id.startsWith('actor_')) {
          const rawId = id.replace('actor_', '');
          updateActor(rawId, { name: newName });
      }
      setNodes((nds) => nds.map(n => n.id === id ? { ...n, data: { ...n.data, label: newName } } : n));
  }, [updateUseCase, updateActor, setNodes]);

  const handleEdgeActionRef = useRef();
  
  handleEdgeActionRef.current = (edgeId, action, payload) => {
      if (mode === 'view') return;
      saveHistory();
      const rawRelId = edgeId.replace('edge_', '');
      
      if (action === 'delete') {
          removeRelation(rawRelId);
          setEdges(eds => eds.filter(e => e.id !== edgeId));
      } else if (action === 'changeType') {
          const newType = payload;
          const existingRel = relations.find(r => r.id.toString() === rawRelId);
          if (existingRel && existingRel.type !== newType) {
              updateRelation(rawRelId, { type: newType });
          }
          setEdges(eds => eds.map(edge => edge.id === edgeId ? { ...edge, data: { ...edge.data, relType: newType }, label: `<<${newType}>>` } : edge));
      } else if (action === 'reverse') {
          const existingRel = relations.find(r => r.id.toString() === rawRelId);
          if (existingRel) {
              updateRelation(rawRelId, {
                  sourceId: existingRel.targetId,
                  targetId: existingRel.sourceId
              });
          }
          
          setEdges(eds => eds.map(e => {
              if (e.id === edgeId) {
                  let newSourceHandle = e.targetHandle || 'left';
                  let newTargetHandle = e.sourceHandle || 'right';

                  return { 
                      ...e, 
                      source: e.target, 
                      target: e.source, 
                      sourceHandle: newSourceHandle, 
                      targetHandle: newTargetHandle, 
                      markerEnd: { type: 'arrowclosed', width: 14, height: 14 } 
                  };
              }
              return e;
          }));
      }
  };

  const handleEdgeAction = useCallback((...args) => {
      handleEdgeActionRef.current?.(...args);
  }, []);

  const initLayout = useCallback(async (forceReset = false) => {
    setIsLoading(true);
    
    try {
      let initialNodes = [];
      let initialEdges = [];

      let savedPositions = null;
      if (projectId && !forceReset) {
          const data = await diagramService.getDiagramLayout(projectId);
          if (data && data.layoutData) {
             const parsed = JSON.parse(data.layoutData);
             savedPositions = parsed.positions || parsed; // Support both new { positions, systemName } format and old backward compatible format
             if (parsed.systemName && onSystemNameLoad) {
                 onSystemNameLoad(parsed.systemName);
             }
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
              isIsolated: uc.isIsolated !== false,
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
          type: 'custom',
          data: { 
              relType: rel.type,
              onEdgeAction: handleEdgeAction
          },
          label: rel.type === 'include' ? '<<include>>' : rel.type === 'extends' ? '<<extends>>' : '',
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
        setEdges(calculateDynamicHandles(layoutedEdges, restoredNodes));
      } else {
        setNodes(layoutedNodes);
        setEdges(calculateDynamicHandles(layoutedEdges, layoutedNodes));
      }

      setTimeout(() => {
        fitView({ padding: 0.08, minZoom: 0.1 });
      }, 100);

    } catch (error) {
      console.error("Failed to load layout", error);
      toast.error("Failed to load layout");
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [projectId, actors, useCases, relations, systemName, fitView]);

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if ((actors.length > 0 || useCases.length > 0) && !isInitialized) {
      initLayout();
    } else if (actors.length === 0 && useCases.length === 0) {
      setIsInitialized(false);
      setIsLoading(false);
    }
  }, [actors.length, useCases.length, initLayout, isInitialized]);

  // Task 1: Sync new actors and useCases to the canvas dynamically
  useEffect(() => {
      if (!isInitialized) return;
      setNodes((nds) => {
          let updated = false;
          const newNodes = [...nds];
          
          actors.forEach(a => {
              const actorId = a.id.toString().startsWith('actor_') ? a.id.toString() : `actor_${a.id}`;
              if (!newNodes.find(n => n.id === actorId)) {
                  newNodes.push({
                      id: actorId,
                      type: 'actor',
                      position: { x: Math.random() * 50 + 50, y: Math.random() * 50 + 50 },
                      data: {
                          label: a.name || 'Actor',
                          side: a.side,
                          onDelete: handleNodeDelete,
                          onNameUpdate: handleNameUpdate
                      }
                  });
                  updated = true;
              }
          });
          
          useCases.forEach(uc => {
              if (uc.showInDiagram === false) return;
              const ucId = `uc_${uc.id}`;
              if (!newNodes.find(n => n.id === ucId)) {
                  newNodes.push({
                      id: ucId,
                      type: 'useCase',
                      position: { x: Math.random() * 50 + 200, y: Math.random() * 50 + 50 },
                      data: {
                          label: uc.name || 'Untitled',
                          group: uc.group,
                          isIsolated: true,
                          onDelete: handleNodeDelete,
                          onNameUpdate: handleNameUpdate
                      }
                  });
                  updated = true;
              }
          });
          
          return updated ? newNodes : nds;
      });

      // Sync relations to canvas dynamically
      setEdges((eds) => {
          let updated = false;
          const newEdges = [...eds];
          relations.forEach(rel => {
              const edgeId = `edge_${rel.id}`;
              if (!newEdges.find(e => e.id === edgeId)) {
                  const sourceStr = rel.sourceId.toString();
                  const targetStr = rel.targetId.toString();
                  const isSourceActor = sourceStr.startsWith('actor_') || actors.some(a => a.id.toString() === sourceStr);
                  const isTargetActor = targetStr.startsWith('actor_') || actors.some(a => a.id.toString() === targetStr);
                  const source = isSourceActor ? (sourceStr.startsWith('actor_') ? sourceStr : `actor_${sourceStr}`) : `uc_${sourceStr}`;
                  const target = isTargetActor ? (targetStr.startsWith('actor_') ? targetStr : `actor_${targetStr}`) : `uc_${targetStr}`;
          
                  newEdges.push({
                      id: edgeId,
                      source,
                      target,
                      type: 'custom',
                      data: { 
                          relType: rel.type,
                          onEdgeAction: handleEdgeAction
                      },
                      label: rel.type === 'include' ? '<<include>>' : rel.type === 'extends' ? '<<extends>>' : '',
                  });
                  updated = true;
              }
          });
          return updated ? newEdges : eds;
      });
  }, [actors, useCases, relations, isInitialized, handleNodeDelete, handleNameUpdate, handleEdgeAction, setNodes, setEdges]);

    // Unified Debounced Auto-save
    const autoSaveTimeout = useRef(null);
    const isSavingRef = useRef(false);
    const isInitialRender = useRef(true);
  
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        if (!isInitialized || nodes.length === 0 || !onSave) return;
        
        if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
        
        autoSaveTimeout.current = setTimeout(async () => {
            if (isSavingRef.current) return;
            isSavingRef.current = true;
            try {
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
                await onSave(dataUrl, positions);
            } finally {
                isSavingRef.current = false;
            }
        }, 2500); // 2.5s debounce
        
        return () => clearTimeout(autoSaveTimeout.current);
    }, [nodes, edges, actors, useCases, relations, systemName, isInitialized, onSave]);

    useEffect(() => {
        const isConnectedToActor = (startId, currentEdges) => {
            const visited = new Set();
            const queue = [startId];
            while(queue.length > 0) {
                const current = queue.shift();
                if (current.startsWith('actor_')) return true;
                visited.add(current);
                
                const connectedEdges = currentEdges.filter(e => e.source === current || e.target === current);
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

        setNodes(nds => {
            const updates = [];
            nds.forEach(node => {
                if (node.type === 'useCase') {
                    const isolated = !isConnectedToActor(node.id, edges);
                    if (node.data.isIsolated !== isolated) {
                        updates.push({ id: node.id, rawId: node.id.replace('uc_', ''), isolated });
                    }
                }
            });

            if (updates.length > 0) {
                // S? d?ng setTimeout d? d?y vi?c update global state ra kh?i lu?ng render hi?n t?i
                // Tránh l?i Maximum update depth exceeded do React ch?n nested updates.
                setTimeout(() => {
                    const store = useDiagramStore.getState();
                    updates.forEach(u => store.updateUseCase(u.rawId, { isIsolated: u.isolated }));
                }, 0);
                
                return nds.map(n => {
                    const update = updates.find(u => u.id === n.id);
                    if (update) {
                        return { ...n, data: { ...n.data, isIsolated: update.isolated } };
                    }
                    return n;
                });
            }
            return nds;
        });
    }, [edges, setNodes]);

    useEffect(() => {
       window.focusDiagramNode = (nodeId) => {
           // nodes is a dependency, but we can access it through state if needed. 
           // Since it's in useEffect, we'll use a ref or just use the current nodes.
           const node = nodes.find(n => n.id === nodeId);
           if (node) {
               setCenter(node.position.x, node.position.y, { zoom: 1, duration: 800 });
           }
       };
       window.exportDiagramDrawio = (name) => {
           exportToDrawio(getNodes(), getEdges(), name);
       };
       return () => {
           delete window.focusDiagramNode;
           delete window.exportDiagramDrawio;
       };
    }, [nodes, setCenter, getNodes, getEdges]);

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
              type: 'custom',
              data: {
                  relType: 'include',
                  onEdgeAction: handleEdgeAction
              },
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
          
          let edgeSource = source;
          let edgeTarget = target;
          let edgeSourceHandle = sourceHandle;
          let edgeTargetHandle = targetHandle;

          if (isSourceUc && isTargetActor) {
              edgeSource = target;
              edgeTarget = source;
              edgeSourceHandle = targetHandle;
              edgeTargetHandle = sourceHandle;
          }

          const newEdge = {
              id: `edge_${relId}`,
              source: edgeSource,
              target: edgeTarget,
              sourceHandle: edgeSourceHandle,
              targetHandle: edgeTargetHandle,
              type: 'custom',
              data: {
                  relType: 'actor-uc',
                  onEdgeAction: handleEdgeAction
              }
          };
          setEdges(eds => addEdge(newEdge, eds));
      }
  }, [edges, nodes, addRelation, saveHistory, handleEdgeAction]);

    const onEdgesDelete = useCallback((edgesToDelete) => {
        saveHistory();
        edgesToDelete.forEach(edge => {
            const relId = edge.id.replace('edge_', '');
            removeRelation(relId);
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
      // Do nothing here, we handle actions inside CustomEdge
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

      {/* Floating edge popup was removed and moved to CustomEdge component */}

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
        edgeTypes={edgeTypes}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        nodesDraggable={!isView}
        nodesConnectable={!isView}
        elementsSelectable={!isView}
        panOnDrag={true}
        zoomOnScroll={true}
        deleteKeyCode={['Backspace', 'Delete']}
        connectionMode={ConnectionMode.Loose}
      >
        {actors.length === 0 && useCases.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
             <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">schema</span>
             {isView ? (
                 <p className="text-gray-500 font-medium">Chưa có sơ đồ diagram cho dự án này.</p>
             ) : (
                 <div className="text-center bg-white/80 p-6 rounded-lg shadow-sm border border-gray-100 pointer-events-auto">
                     <p className="text-gray-600 font-medium mb-2">Bản vẽ đang trống.</p>
                     <p className="text-gray-500 text-sm">Hãy kéo thả Actor hoặc Use Case từ cột bên trái vào đây để bắt đầu.</p>
                     <p className="text-red-400 text-xs mt-2 italic">*Lưu ý: Cần tạo ít nhất 1 Requirement trước khi tạo Use Case mới.</p>
                 </div>
             )}
          </div>
        )}
        <Background color="#E2E8F0" gap={24} size={1} />
        {!isView && <Controls />}
      </ReactFlow>
    </div>
  );
  });
  
export const UCDiagram = forwardRef((props, ref) => (
   <ReactFlowProvider>
      <FlowContent {...props} ref={ref} />
   </ReactFlowProvider>
));
