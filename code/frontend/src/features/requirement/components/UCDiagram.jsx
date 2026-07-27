import React, { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { exportToDrawio } from '../utils/drawioExporter';
import {
  ReactFlow,
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
import dagre from 'dagre';
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
        if (edge.data?.isCustomHandle) return edge;
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
        
        if (isSourceActor && isTargetActor) {
            // Actor to Actor (Generalization)
            // "nối từ ở dưới đít actor trỏ mũi tên đến bên cạnh actor cha"
            newSourceHandle = 'bottom';
            if (sx < tx) {
                newTargetHandle = 'left';
            } else {
                newTargetHandle = 'right';
            }
        } else if (isSourceActor && !isTargetActor) {
            // Actor to UseCase
            if (Math.abs(sx - tx) > Math.abs(sy - ty)) {
                // Actor is horizontally left/right
                if (sx < tx) {
                    newSourceHandle = 'right';
                    newTargetHandle = 'left';
                } else {
                    newSourceHandle = 'left';
                    newTargetHandle = 'right';
                }
            } else {
                // Actor is vertically above/below (like parent actor)
                if (sy < ty) {
                    newSourceHandle = 'bottom';
                    newTargetHandle = 'top';
                } else {
                    // "actor ở dưới như actor cha thì dây nối sẽ nối từ đỉnh đầu actor đến ở giữa ô uc"
                    newSourceHandle = 'top';
                    newTargetHandle = 'bottom';
                }
            }
        } else if (!isSourceActor && isTargetActor) {
            // UseCase to Actor
            if (Math.abs(sx - tx) > Math.abs(sy - ty)) {
                if (sx < tx) {
                    newSourceHandle = 'right';
                    newTargetHandle = 'left';
                } else {
                    newSourceHandle = 'left';
                    newTargetHandle = 'right';
                }
            } else {
                if (sy < ty) {
                    newSourceHandle = 'bottom';
                    newTargetHandle = 'top'; // "từ đỉnh đầu actor"
                } else {
                    newSourceHandle = 'top';
                    newTargetHandle = 'bottom'; // "dưới đít actor"
                }
            }
        } else {
            // UseCase to UseCase
            if (Math.abs(sx - tx) > Math.abs(sy - ty) * 1.5) {
                // Horizontally distant
                if (sx < tx) {
                    newSourceHandle = 'right';
                    newTargetHandle = 'left';
                } else {
                    newSourceHandle = 'left';
                    newTargetHandle = 'right';
                }
            } else {
                // Vertically distant
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

const FlowContent = forwardRef(({ projectId, currentModuleId, actors = [], useCases = [], relations = [], systemName, mode, onSave, onUnsavedChanges, onSystemNameLoad, isLeader, onApproveUseCase, onRejectUseCase, activeView, currentUserId }, ref) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reactFlowWrapper = useRef(null);
  
  const { fitView, setCenter, project, getNodes, getEdges } = useReactFlow();
  const hasManualEditsRef = useRef(false);
  
  useImperativeHandle(ref, () => ({
    exportDrawio: (diagramName) => {
      exportToDrawio(getNodes(), getEdges(), diagramName);
    },
    forceSave: async (includeImage = false) => {
        if (!onSave) return;
        const layoutDataObj = {
            positions: {},
            edges: {},
            hasManualEdits: hasManualEditsRef.current
        };
        const currentNodes = getNodes();
        const currentEdges = getEdges();
        currentNodes.forEach(n => {
            layoutDataObj.positions[n.id] = {
                x: n.position.x,
                y: n.position.y,
                width: n.width || n.style?.width,
                height: n.height || n.style?.height
            };
        });
        currentEdges.forEach(e => {
            layoutDataObj.edges[e.id] = {
                sourceHandle: e.sourceHandle,
                targetHandle: e.targetHandle,
                isCustomHandle: true
            };
        });

        let dataUrl = null;
        if (includeImage) {
            try {
                const flowEl = document.querySelector('.react-flow');
                if (flowEl) {
                    const { toPng } = await import('html-to-image');
                    dataUrl = await toPng(flowEl, { 
                        filter: (node) => !node.classList?.contains('react-flow__minimap') && !node.classList?.contains('react-flow__controls'),
                        backgroundColor: '#f9fafb',
                        skipFonts: true
                    });
                }
            } catch (e) {
                console.error("Failed to generate thumbnail PNG:", e);
            }
        }

        await onSave(dataUrl, layoutDataObj);
    }
  }), [getNodes, getEdges, onSave]);

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

  const onNodesChange = useCallback(
    (changes) => {
        const removeChanges = changes.filter(c => c.type === 'remove');
        if (removeChanges.length > 0) {
            saveHistory();
            removeChanges.forEach(change => {
                const id = change.id;
                if (id.startsWith('uc_')) {
                    const rawId = id.replace('uc_', '');
                    updateUseCase(rawId, { showInDiagram: false });
                } else if (id.startsWith('actor_')) {
                    const rawId = id.replace('actor_', '');
                    removeActor(rawId);
                }
            });
        }
        
        setNodes((nds) => {
            const updatedNodes = applyNodeChanges(changes, nds);
            if (changes.some(c => c.type === 'position' && c.dragging)) {
                hasManualEditsRef.current = true;
            }
            return updatedNodes;
        });
        const isSignificant = changes.some(c => (c.type === 'position' && c.dragging) || c.type === 'remove');
        if (isSignificant && onUnsavedChanges) onUnsavedChanges();
    },
    [onUnsavedChanges, setEdges, saveHistory, updateUseCase, removeActor]
  );
  
  const onEdgesChange = useCallback(
    (changes) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));
        const isSignificant = changes.some(c => c.type === 'remove' || c.type === 'add');
        if (isSignificant && onUnsavedChanges) onUnsavedChanges();
    },
    [onUnsavedChanges]
  );

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
          if (onUnsavedChanges) onUnsavedChanges();
      } else if (action === 'changeType') {
          const newType = payload;
          const existingRel = relations.find(r => r.id.toString() === rawRelId);
          if (existingRel && existingRel.type !== newType) {
              updateRelation(rawRelId, { type: newType });
          }
          setEdges(eds => eds.map(edge => {
              if (edge.id === edgeId) {
                  const isDep = newType === 'include' || newType === 'extends';
                  return { 
                      ...edge, 
                      data: { ...edge.data, relType: newType }, 
                      label: `<<${newType}>>`,
                      style: isDep ? { strokeDasharray: '5,5' } : {},
                  };
              }
              return edge;
          }));
          if (onUnsavedChanges) onUnsavedChanges();
      } else if (action === 'updateControlPoint') {
          setEdges(eds => eds.map(edge => {
              if (edge.id === edgeId) {
                  return { ...edge, data: { ...edge.data, controlPoint: payload } };
              }
              return edge;
          }));
          if (onUnsavedChanges) onUnsavedChanges();
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
          if (onUnsavedChanges) onUnsavedChanges();
      }
  };

  const handleEdgeAction = useCallback((...args) => {
      handleEdgeActionRef.current?.(...args);
  }, []);

  // Lightweight re-layout without showing loading spinner (for bulk-add sync)
  const relayoutSilently = useCallback((currentActors, currentUcs, currentRelations, currentSystemName) => {
    const buildNodes = [];
    const buildEdges = [];
    currentActors.forEach((a) => {
      const actorId = a.id.toString().startsWith('actor_') ? a.id.toString() : `actor_${a.id}`;
      buildNodes.push({
        id: actorId, type: 'actor', position: { x: 0, y: 0 },
        data: { label: a.name || 'Actor', side: a.side, onDelete: handleNodeDelete, onNameUpdate: handleNameUpdate },
      });
    });
    currentUcs.forEach((uc) => {
      if (uc.showInDiagram === false) return;
      buildNodes.push({
        id: `uc_${uc.id}`, type: 'useCase', position: { x: 0, y: 0 },
        data: { label: uc.name || 'Untitled', group: uc.group, isIsolated: uc.isIsolated !== false, onDelete: handleNodeDelete, onNameUpdate: handleNameUpdate },
      });
    });
    currentRelations.forEach((rel) => {
      const sourceStr = rel.sourceId.toString();
      const targetStr = rel.targetId.toString();
      if (sourceStr === targetStr) return; // Prevent self-loops from generating weird edge stubs
      
      const isSourceActor = sourceStr.startsWith('actor_') || currentActors.some(a => a.id.toString() === sourceStr);
      const isTargetActor = targetStr.startsWith('actor_') || currentActors.some(a => a.id.toString() === targetStr);
      const source = isSourceActor ? (sourceStr.startsWith('actor_') ? sourceStr : `actor_${sourceStr}`) : `uc_${sourceStr}`;
      const target = isTargetActor ? (targetStr.startsWith('actor_') ? targetStr : `actor_${targetStr}`) : `uc_${targetStr}`;
      
      // Ensure both source and target exist in buildNodes to avoid dangling edge stubs
      const sourceExists = buildNodes.some(n => n.id === source);
      const targetExists = buildNodes.some(n => n.id === target);
      if (!sourceExists || !targetExists) return;

      const isDep = rel.type === 'include' || rel.type === 'extends';
      const isActorGen = rel.type === 'actor-generalization';
      buildEdges.push({
        id: `edge_${rel.id}`, source, target, type: 'custom',
        data: { relType: rel.type, onEdgeAction: handleEdgeAction },
        label: rel.type === 'include' ? '<<include>>' : rel.type === 'extends' ? '<<extends>>' : '',
        style: isDep ? { strokeDasharray: '5,5' } : (isActorGen ? { strokeWidth: 1.5 } : {}),
        markerEnd: isDep ? { type: 'arrowclosed', width: 14, height: 14 } : (isActorGen ? 'actor-generalization-marker' : undefined),
      });
    });
    const { nodes: layoutedNodes, edges: layoutedEdges } = ucLayoutEngine(buildNodes, buildEdges, currentSystemName);
    const enhanced = layoutedNodes.map(n => ({ ...n, zIndex: n.id === 'system_boundary' ? 0 : 2 }));
    setNodes(enhanced);
    setEdges(calculateDynamicHandles(layoutedEdges, enhanced).map(e => ({ ...e, zIndex: 1 })));
    setTimeout(() => { fitView({ padding: 0.08, minZoom: 0.1 }); }, 150);
  }, [handleNodeDelete, handleNameUpdate, handleEdgeAction, setNodes, setEdges, fitView]);

  const initLayout = useCallback(async (forceReset = false) => {
    setIsLoading(true);
    
    try {
      let initialNodes = [];
      let initialEdges = [];

      let savedPositions = null;
      let savedEdges = {};
      let hasManualEdits = false;
      if (projectId && !forceReset) {
          const data = await diagramService.getDiagramLayout(projectId, currentModuleId);
          if (data && data.layoutData) {
             const parsed = JSON.parse(data.layoutData);
             savedPositions = parsed.positions || parsed; // Support both new { positions, systemName } format and old backward compatible format
             savedEdges = parsed.edges || {};
             hasManualEdits = parsed.hasManualEdits === true;
             hasManualEditsRef.current = hasManualEdits;
             
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
        
        // Filter based on activeView (handled by backend now)
        const id = uc.id?.toString() || uc.name;


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
              onNameUpdate: handleNameUpdate,
              isLeader: isLeader,
              onApprove: onApproveUseCase,
              onReject: onRejectUseCase,
              status: uc.status
          },
        });
      });

      relations.forEach((rel) => {
        const sourceStr = rel.sourceId.toString();
        const targetStr = rel.targetId.toString();
        if (sourceStr === targetStr) return; // Prevent self-loops from generating weird edge stubs
        
        const isSourceActor = sourceStr.startsWith('actor_') || actors.some(a => a.id.toString() === sourceStr);
        const isTargetActor = targetStr.startsWith('actor_') || actors.some(a => a.id.toString() === targetStr);
        const source = isSourceActor ? (sourceStr.startsWith('actor_') ? sourceStr : `actor_${sourceStr}`) : `uc_${sourceStr}`;
        const target = isTargetActor ? (targetStr.startsWith('actor_') ? targetStr : `actor_${targetStr}`) : `uc_${targetStr}`;

        // Ensure both source and target exist in initialNodes to avoid dangling edge stubs
        const sourceExists = initialNodes.some(n => n.id === source);
        const targetExists = initialNodes.some(n => n.id === target);
        if (!sourceExists || !targetExists) return;

        const isDependency = rel.type === 'include' || rel.type === 'extends';

        const isActorGen = rel.type === 'actor-generalization';

        initialEdges.push({
          id: `edge_${rel.id}`,
          source,
          target,
          sourceHandle: savedEdges[`edge_${rel.id}`]?.sourceHandle,
          targetHandle: savedEdges[`edge_${rel.id}`]?.targetHandle,
          type: 'custom',
          data: { 
              relType: rel.type,
              onEdgeAction: handleEdgeAction,
              isCustomHandle: savedEdges[`edge_${rel.id}`]?.isCustomHandle
          },
          label: rel.type === 'include' ? '<<include>>' : rel.type === 'extends' ? '<<extends>>' : '',
          style: isDependency ? { strokeDasharray: '5,5' } : (isActorGen ? { strokeWidth: 1.5 } : {}),
          markerEnd: isDependency ? { type: 'arrowclosed', width: 14, height: 14 } : (isActorGen ? 'actor-generalization-marker' : undefined)
        });
      });

        // --- DAGRE AUTO LAYOUT ENGINE ---
        const getLayoutedElements = (nodes, edges, direction = 'LR') => {
            const dagreGraph = new dagre.graphlib.Graph();
            dagreGraph.setDefaultEdgeLabel(() => ({}));
            
            const isHorizontal = direction === 'LR';
            // Increase spacing for better aesthetics
            dagreGraph.setGraph({ 
                rankdir: direction, 
                nodesep: 80, // vertical space between nodes
                ranksep: 180 // horizontal space between levels
            });

            // Add nodes to dagre
            nodes.forEach((node) => {
                // Skip system boundary for layout calculation
                if (node.id === 'system_boundary') return;
                
                // Estimate dimensions based on type
                const width = node.type === 'actor' ? 60 : 180;
                const height = node.type === 'actor' ? 100 : 60;
                
                dagreGraph.setNode(node.id, { width, height });
            });

            // Add edges to dagre
            edges.forEach((edge) => {
                dagreGraph.setEdge(edge.source, edge.target);
            });

            // Calculate layout
            dagre.layout(dagreGraph);

            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;

            // Sort nodes vertically so we can stagger actors top-to-bottom
            const sortedNodes = [...nodes].sort((a, b) => {
                if (a.id === 'system_boundary' || b.id === 'system_boundary') return 0;
                return dagreGraph.node(a.id).y - dagreGraph.node(b.id).y;
            });

            let leftActorStagger = 0;
            let rightActorStagger = 0;

            const newNodesMap = new Map();

            sortedNodes.forEach((node) => {
                if (node.id === 'system_boundary') {
                    newNodesMap.set(node.id, node);
                    return;
                }
                
                const nodeWithPosition = dagreGraph.node(node.id);
                let x = nodeWithPosition.x - (node.type === 'actor' ? 30 : 90);
                const y = nodeWithPosition.y - (node.type === 'actor' ? 50 : 30);
                
                const side = node.data?.side || (nodeWithPosition.x < (dagreGraph.graph().width / 2) ? 'left' : 'right');

                if (node.type === 'actor') { 
                    if (side === 'left') {
                        x -= leftActorStagger * 60; // Push further outside (left)
                        leftActorStagger = (leftActorStagger + 1) % 4; 
                    } else if (side === 'right') {
                        x += rightActorStagger * 60; // Push further outside (right)
                        rightActorStagger = (rightActorStagger + 1) % 4; 
                    }
                }

                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x + (node.type === 'actor' ? 60 : 180));
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y + (node.type === 'actor' ? 100 : 60));

                newNodesMap.set(node.id, {
                    ...node,
                    position: { x, y },
                    data: { ...node.data, side },
                    zIndex: 2,
                });
            });

            const newNodes = nodes.map(n => newNodesMap.get(n.id));
            
            // Adjust system boundary to fit around Use Cases (not actors if possible, but for simplicity, we wrap all UCs)
            const ucNodes = newNodes.filter(n => n.type === 'useCase');
            let sysMinX = Infinity, sysMaxX = -Infinity, sysMinY = Infinity, sysMaxY = -Infinity;
            
            if (ucNodes.length > 0) {
                ucNodes.forEach(uc => {
                    sysMinX = Math.min(sysMinX, uc.position.x);
                    sysMaxX = Math.max(sysMaxX, uc.position.x + 180);
                    sysMinY = Math.min(sysMinY, uc.position.y);
                    sysMaxY = Math.max(sysMaxY, uc.position.y + 60);
                });
            } else {
                sysMinX = 200; sysMaxX = 600; sysMinY = 0; sysMaxY = 400;
            }

            const sysBoundary = nodes.find(n => n.id === 'system_boundary');
            if (sysBoundary) {
                // Add padding
                const paddingX = 40;
                const paddingY = 60; // Extra top padding for title
                sysBoundary.position = { x: sysMinX - paddingX, y: sysMinY - paddingY };
                sysBoundary.style = { 
                    width: sysMaxX - sysMinX + (paddingX * 2), 
                    height: sysMaxY - sysMinY + (paddingY * 2) 
                };
                sysBoundary.zIndex = 0;
                
                // Replace old boundary
                const idx = newNodes.findIndex(n => n.id === 'system_boundary');
                if (idx !== -1) newNodes[idx] = sysBoundary;
                else newNodes.push(sysBoundary);
            }

            return { nodes: newNodes, edges };
        };

        let layoutedNodes, layoutedEdges;

        const hasNewNodes = savedPositions && initialNodes.some(n => n.id !== 'system_boundary' && !savedPositions[n.id]);

      if (savedPositions && !forceReset && hasManualEdits) {
        // Try restoring positions
        let maxOldY = 0;
        const newOnlyNodes = [];
        const oldRestored = [];

        initialNodes.forEach(node => {
            if (node.id === 'system_boundary') return;
            if (savedPositions[node.id]) {
                const posData = savedPositions[node.id];
                const newNode = { ...node, position: { x: posData.x, y: posData.y }, zIndex: 2 };
                if (posData.width !== undefined && posData.height !== undefined) {
                    newNode.style = { ...newNode.style, width: posData.width, height: posData.height };
                }
                oldRestored.push(newNode);
                maxOldY = Math.max(maxOldY, posData.y + (node.type === 'actor' ? 100 : 60));
            } else {
                newOnlyNodes.push(node);
            }
        });

        let restoredNodes = [...oldRestored];

        if (newOnlyNodes.length > 0) {
            // Run full layout to get ideal relative positions for ALL nodes
            const layoutResult = ucLayoutEngine(initialNodes, initialEdges, systemName);
            
            // Place new nodes at their ideal positions
            layoutResult.nodes.forEach(dagreNode => {
                if (dagreNode.id !== 'system_boundary' && !savedPositions[dagreNode.id]) {
                    restoredNodes.push({
                        ...dagreNode,
                        position: { x: dagreNode.position.x, y: dagreNode.position.y },
                        zIndex: 2
                    });
                }
            });
        }
        
        let sysMinX = Infinity, sysMaxX = -Infinity, sysMinY = Infinity, sysMaxY = -Infinity;
        const ucNodes = restoredNodes.filter(n => n.type === 'useCase');
        if (ucNodes.length > 0) {
            ucNodes.forEach(uc => {
                sysMinX = Math.min(sysMinX, uc.position.x);
                sysMaxX = Math.max(sysMaxX, uc.position.x + 180);
                sysMinY = Math.min(sysMinY, uc.position.y);
                sysMaxY = Math.max(sysMaxY, uc.position.y + 60);
            });
        } else {
            sysMinX = 200; sysMaxX = 600; sysMinY = 0; sysMaxY = 400;
        }

        const paddingX = 40;
        const paddingY = 60;
        const sysBoundary = {
            id: 'system_boundary',
            type: 'systemBoundary',
            position: { x: sysMinX - paddingX, y: sysMinY - paddingY },
            data: { label: systemName },
            draggable: true,
            selectable: true,
            className: '!pointer-events-none',
            style: { 
                width: sysMaxX - sysMinX + (paddingX * 2), 
                height: sysMaxY - sysMinY + (paddingY * 2) 
            },
            zIndex: 0
        };
        restoredNodes.push(sysBoundary);

        layoutedNodes = restoredNodes;
        layoutedEdges = initialEdges;
      } else {
        // Force reset or no saved positions — use ucLayoutEngine for proper 2-side actor split + system boundary
        const layoutResult = ucLayoutEngine(initialNodes, initialEdges, systemName);
        layoutedNodes = layoutResult.nodes.map(n => ({ ...n, zIndex: n.id === 'system_boundary' ? 0 : 2 }));
        layoutedEdges = layoutResult.edges;
      }

      setNodes(layoutedNodes);
      setEdges(calculateDynamicHandles(layoutedEdges, layoutedNodes).map(e => ({ ...e, zIndex: 1 })));

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
  }, [projectId, actors, useCases, relations, systemName, fitView, currentModuleId]);

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if ((actors.length > 0 || useCases.length > 0) && !isInitialized) {
      initLayout();
    } else if (actors.length === 0 && useCases.length === 0 && !isInitialized) {
      // If it's the first time loading an empty project, just stop loading.
      // Do not revert isInitialized to false if it's already true, to preserve auto-save.
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [actors.length, useCases.length, initLayout, isInitialized]);

  // Track whether we need a full re-layout after a bulk add (e.g. AI generation)
  const needsRelayoutRef = useRef(false);
  const prevActorCountRef = useRef(actors.length);
  const prevUcCountRef = useRef(useCases.length);

  // Task 1: Sync new actors and useCases to the canvas dynamically and remove deleted ones
  useEffect(() => {
      if (!isInitialized) return;
      
      // Detect if large number of nodes were added (bulk AI generation)
      const actorDiff = actors.length - prevActorCountRef.current;
      const ucDiff = useCases.length - prevUcCountRef.current;
      prevActorCountRef.current = actors.length;
      prevUcCountRef.current = useCases.length;
      if (actorDiff > 1 || ucDiff > 1) {
          needsRelayoutRef.current = true;
      }

      setNodes((nds) => {
          let updated = false;
          const newNodes = [...nds];
          
          // 1. Remove nodes that no longer exist in the store
          for (let i = newNodes.length - 1; i >= 0; i--) {
              const node = newNodes[i];
              if (node.id === 'system_boundary') continue;
              
              if (node.id.startsWith('actor_')) {
                  const rawId = node.id.replace('actor_', '');
                  if (!actors.find(a => a.id.toString() === rawId || a.id.toString() === `actor_${rawId}`)) {
                      newNodes.splice(i, 1);
                      updated = true;
                  }
              } else if (node.id.startsWith('uc_')) {
                  const rawId = node.id.replace('uc_', '');
                  if (!useCases.find(uc => uc.id.toString() === rawId && uc.showInDiagram !== false)) {
                      newNodes.splice(i, 1);
                      updated = true;
                  }
              }
          }
          
          // 2. Add or update actors
          actors.forEach(a => {
              const actorId = a.id.toString().startsWith('actor_') ? a.id.toString() : `actor_${a.id}`;
              const index = newNodes.findIndex(n => n.id === actorId);
              if (index === -1) {
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
              } else if (newNodes[index].data.label !== a.name) {
                  newNodes[index] = {
                      ...newNodes[index],
                      data: { ...newNodes[index].data, label: a.name || 'Actor' }
                  };
                  updated = true;
              }
          });
          
          // 3. Add or update use cases
          useCases.forEach(uc => {
              if (uc.showInDiagram === false) return;
              const ucId = `uc_${uc.id}`;
              const index = newNodes.findIndex(n => n.id === ucId);
              if (index === -1) {
                  // Check if this UC already has relations to actors (transitively) so it shouldn't appear as isolated
                  const ucRawId = uc.id.toString();
                  const visited = new Set();
                  const queue = [ucRawId];
                  let hasActorConnection = false;
                  
                  while(queue.length > 0 && !hasActorConnection) {
                      const current = queue.shift();
                      visited.add(current);
                      const connectedRels = relations.filter(r => r.sourceId.toString() === current || r.targetId.toString() === current);
                      for (const rel of connectedRels) {
                          const otherStr = rel.sourceId.toString() === current ? rel.targetId.toString() : rel.sourceId.toString();
                          if (actors.some(a => a.id.toString() === otherStr)) {
                              hasActorConnection = true;
                              break;
                          }
                          if (!visited.has(otherStr)) {
                              queue.push(otherStr);
                              visited.add(otherStr);
                          }
                      }
                  }
                  newNodes.push({
                      id: ucId,
                      type: 'useCase',
                      position: { x: Math.random() * 50 + 200, y: Math.random() * 50 + 50 },
                      data: {
                          label: uc.name || 'Untitled',
                          group: uc.group,
                          isIsolated: !hasActorConnection,
                          onDelete: handleNodeDelete,
                          onNameUpdate: handleNameUpdate
                      }
                  });
                  updated = true;
              } else if (newNodes[index].data.label !== uc.name) {
                  newNodes[index] = {
                      ...newNodes[index],
                      data: { ...newNodes[index].data, label: uc.name || 'Untitled' }
                  };
                  updated = true;
              }
          });
          
          return updated ? newNodes : nds;
      });

      // Sync relations to canvas dynamically
      setEdges((eds) => {
          let updated = false;
          const newEdges = [...eds];
          
          // 1. Remove edges that no longer exist in the store
          for (let i = newEdges.length - 1; i >= 0; i--) {
              const edge = newEdges[i];
              if (edge.id.startsWith('edge_')) {
                  const rawId = edge.id.replace('edge_', '');
                  if (!relations.find(r => r.id.toString() === rawId)) {
                      newEdges.splice(i, 1);
                      updated = true;
                  }
              }
          }

          // 2. Add new edges
          relations.forEach(rel => {
              const edgeId = `edge_${rel.id}`;
              if (!newEdges.find(e => e.id === edgeId)) {
                  const sourceStr = rel.sourceId.toString();
                  const targetStr = rel.targetId.toString();
                  const isSourceActor = sourceStr.startsWith('actor_') || actors.some(a => a.id.toString() === sourceStr);
                  const isTargetActor = targetStr.startsWith('actor_') || actors.some(a => a.id.toString() === targetStr);
                  const source = isSourceActor ? (sourceStr.startsWith('actor_') ? sourceStr : `actor_${sourceStr}`) : `uc_${sourceStr}`;
                  const target = isTargetActor ? (targetStr.startsWith('actor_') ? targetStr : `actor_${targetStr}`) : `uc_${targetStr}`;
          
                  const isDependency = rel.type === 'include' || rel.type === 'extends';
                  const isActorGen = rel.type === 'actor-generalization';
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
                      style: isDependency ? { strokeDasharray: '5,5' } : (isActorGen ? { strokeWidth: 1.5 } : {}),
                      markerEnd: isDependency ? { type: 'arrowclosed', width: 14, height: 14 } : (isActorGen ? 'actor-generalization-marker' : undefined)
                  });
                  updated = true;
              }
          });
          
          return updated ? newEdges : eds;
      });

      // If bulk nodes were added, do a silent re-layout AFTER state updates settle
      if (needsRelayoutRef.current) {
          needsRelayoutRef.current = false;
          setTimeout(() => {
              relayoutSilently(actors, useCases, relations, systemName);
          }, 200);
      }
  }, [actors, useCases, relations, isInitialized, handleNodeDelete, handleNameUpdate, handleEdgeAction, setNodes, setEdges, relayoutSilently, systemName]);

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
            try {
                const layoutDataObj = {
                    positions: {},
                    edges: {},
                    hasManualEdits: hasManualEditsRef.current
                };
                nodes.forEach(n => { 
                    layoutDataObj.positions[n.id] = {
                        x: n.position.x,
                        y: n.position.y,
                        width: n.width || n.style?.width,
                        height: n.height || n.style?.height
                    }; 
                });
                edges.forEach(e => {
                    layoutDataObj.edges[e.id] = {
                        sourceHandle: e.sourceHandle,
                        targetHandle: e.targetHandle,
                        isCustomHandle: true
                    };
                });
                
                let dataUrl = null;
                // Temporarily disabled toPng during auto-save to prevent UI freezing and saving failures.
                // It takes too much CPU to generate a PNG on every mouse drag.
                await onSave(dataUrl, layoutDataObj);
            } catch (outerErr) {
                console.error("Auto-save outer error:", outerErr);
            }
        }, 1000); // 1s debounce
        
        return () => clearTimeout(autoSaveTimeout.current);
    }, [nodes, edges, isInitialized, onSave]);

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
      const { drawingMode, addRelation } = useDiagramStore.getState();

      if (source === target) {
          toast.error("Không được phép tự nối với chính mình!");
          return;
      }

      const existingEdge = edges.find(e => 
          (e.source === source && e.target === target) || 
          (e.source === target && e.target === source)
      );
      if (existingEdge) {
          toast.error("Đã tồn tại liên kết giữa 2 phần tử này");
          return;
      }

      const isSourceActor = source.startsWith('actor_');
      const isTargetActor = target.startsWith('actor_');
      const isSourceUc = source.startsWith('uc_');
      const isTargetUc = target.startsWith('uc_');

      let relType = drawingMode;
      if (drawingMode === 'auto') {
          if (isSourceActor && isTargetActor) relType = 'actor-generalization';
          else if (isSourceUc && isTargetUc) relType = 'include';
          else relType = 'actor-uc';
      }

      if (drawingMode === 'auto' && isSourceUc && isTargetUc) {
          const sourceNode = nodes.find(n => n.id === source);
          const targetNode = nodes.find(n => n.id === target);
          if (sourceNode?.data?.isIsolated && targetNode?.data?.isIsolated) {
              toast.error("Tuyệt đối không được nối Include/Extend giữa hai Use Case cô đơn!");
              return;
          }
      }

      saveHistory();
      const relId = Date.now().toString();
      
      const newRel = {
          id: relId,
          type: relType,
          sourceId: source.replace('actor_', '').replace('uc_', ''),
          targetId: target.replace('actor_', '').replace('uc_', '')
      };
      
      // Auto mode: correctly assign actor/uc relation direction
      if (drawingMode === 'auto' && relType === 'actor-uc') {
          newRel.sourceId = isSourceActor ? source.replace('actor_', '') : target.replace('actor_', '');
          newRel.targetId = isTargetUc ? target.replace('uc_', '') : source.replace('uc_', '');
      }

      addRelation(newRel);

      const isDep = relType === 'include' || relType === 'extends';
      const isActorGen = relType === 'actor-generalization';

      const newEdge = {
          id: `edge_${relId}`,
          source: (drawingMode === 'auto' && relType === 'actor-uc' && !isSourceActor) ? target : source, // Fix visual direction for auto
          target: (drawingMode === 'auto' && relType === 'actor-uc' && !isSourceActor) ? source : target,
          sourceHandle: (drawingMode === 'auto' && relType === 'actor-uc' && !isSourceActor) ? targetHandle : sourceHandle,
          targetHandle: (drawingMode === 'auto' && relType === 'actor-uc' && !isSourceActor) ? sourceHandle : targetHandle,
          type: 'custom',
          data: {
              relType: relType,
              onEdgeAction: handleEdgeAction,
              isCustomHandle: true
          },
          label: relType === 'include' ? '<<include>>' : relType === 'extends' ? '<<extends>>' : '',
          style: isDep ? { strokeDasharray: '5,5' } : (isActorGen ? { strokeWidth: 1.5 } : {}),
          markerEnd: isDep ? { type: 'arrowclosed', width: 14, height: 14 } : (isActorGen ? 'actor-generalization-marker' : undefined),
          zIndex: 1,
      };
      
      setEdges(eds => addEdge(newEdge, eds));
      if (onUnsavedChanges) onUnsavedChanges();
  }, [edges, nodes, handleEdgeAction, saveHistory, onUnsavedChanges]);

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

  useEffect(() => {
      if (mode === 'view') {
          setNodes(nds => nds.map(n => n.selected ? { ...n, selected: false } : n));
          setEdges(eds => eds.map(e => e.selected ? { ...e, selected: false } : e));
      }
  }, [mode, setNodes, setEdges]);
  
  useEffect(() => {
      if (nodes.length > 0 && edges.length > 0) {
          const needsHandles = edges.some(e => !e.sourceHandle && !e.targetHandle && !e.data?.isCustomHandle);
          if (needsHandles) {
              setEdges(eds => calculateDynamicHandles(eds, nodes));
          }
      }
  }, [edges, nodes, setEdges]);



  const handleResetLayout = () => {
      saveHistory();
      initLayout(true);
      toast.success("Đã chạy Auto Layout!");
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 h-full w-full min-h-[500px]">
         <div className="w-8 h-8 border-4 border-[#1E707D] border-t-transparent rounded-full animate-spin"></div>
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
                className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md shadow-sm hover:bg-gray-50 flex items-center gap-1 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUndo}
                disabled={history.length === 0}
                title="Return"
              >
                <span className="material-symbols-outlined text-[16px]">undo</span>
                Return
              </button>
         </div>
      )}

      {/* Floating edge popup was removed and moved to CustomEdge component */}

      <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
        <defs>
          <marker
            id="actor-generalization-marker"
            viewBox="0 0 12 12"
            refX="10"
            refY="6"
            markerWidth="12"
            markerHeight="12"
            orient="auto-start-reverse"
          >
            <path d="M 0,1 L 11,6 L 0,11 Z" fill="white" stroke="#374151" strokeWidth="1.2" strokeLinejoin="round" />
          </marker>
        </defs>
      </svg>
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
        deleteKeyCode={isView ? null : ['Backspace', 'Delete']}
        connectionMode={ConnectionMode.Loose}
        elevateNodesOnSelect={false}
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
      </ReactFlow>
    </div>
  );
});

export const UCDiagram = forwardRef(({ projectId, currentModuleId, actors, useCases, relations, systemName, mode, onSave, onUnsavedChanges, onSystemNameLoad, isLeader, onApproveUseCase, onRejectUseCase, activeView, currentUserId }, ref) => {
  return (
    <ReactFlowProvider>
      <FlowContent 
        ref={ref}
        projectId={projectId}
        currentModuleId={currentModuleId}
        actors={actors}
        useCases={useCases}
        relations={relations}
        systemName={systemName}
        mode={mode}
        onSave={onSave}
        onUnsavedChanges={onUnsavedChanges}
        onSystemNameLoad={onSystemNameLoad}
        isLeader={isLeader}
        onApproveUseCase={onApproveUseCase}
        onRejectUseCase={onRejectUseCase}
        activeView={activeView}
        currentUserId={currentUserId}
      />
    </ReactFlowProvider>
  );
});
