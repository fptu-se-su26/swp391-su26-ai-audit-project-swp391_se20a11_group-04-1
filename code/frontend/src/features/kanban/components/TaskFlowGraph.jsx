import React, { useMemo, useEffect, useCallback } from 'react';
import { 
  ReactFlow, 
  ReactFlowProvider, 
  Background, 
  Controls, 
  MarkerType,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

// ─── CUSTOM NODE ───────────────────────────────────────────────────────────
const CustomTaskNode = ({ data }) => {
  const { task, duplicationRisks = [], coverageGaps = [], isDimmed, isHovered } = data;
  const hasDup = duplicationRisks.some(r => r.generated_task_temp_id === task.temp_id) && !['MERGE_INTO_EXISTING', 'KEEP_BOTH'].includes(task._syncAction);
  const hasGap = coverageGaps.some(g => task.use_case_code && g.use_case_code === task.use_case_code);
  const isMerged = task.is_merged_result;
  const isSplit = task.is_split_child;
  
  let borderColor = 'border-teal-200';
  let bgColor = 'bg-teal-50';
  let dotColor = 'bg-teal-400';
  let textStyle = '';
  
  if (hasDup) { 
    borderColor = 'border-rose-400 border-dashed'; bgColor = 'bg-rose-50'; dotColor = 'bg-rose-400'; textStyle = 'text-rose-600 font-semibold'; 
  } else if (isMerged) { 
    borderColor = 'border-amber-400'; bgColor = 'bg-amber-50'; dotColor = 'bg-amber-400'; 
  } else if (isSplit) { 
    borderColor = 'border-purple-400'; bgColor = 'bg-purple-50'; dotColor = 'bg-purple-400'; 
  }

  const isManuallyUnchecked = isDimmed && !hasDup;

  if (isManuallyUnchecked) {
    textStyle = 'line-through decoration-slate-400 text-slate-400';
  }

  if (isHovered) {
    borderColor = `${borderColor} ring-2 ring-slate-200/50 shadow-lg scale-105`;
  }

  const opacityClass = isManuallyUnchecked ? 'opacity-30 grayscale' : 'opacity-100 transition-all duration-300';

  return (
    <div className={`w-[200px] min-h-[60px] p-2.5 rounded-lg border-2 ${borderColor} ${bgColor} shadow-sm flex items-center justify-center gap-2 relative ${opacityClass} z-10 transition-colors`}>
      <Handle type="target" position={Position.Top} className={`!w-2 !h-2 !${dotColor} !border-white !border-2 !-mt-1`} />
      
      <div className="flex items-center justify-start w-full gap-2 px-1">
         <span className="text-[10px] font-bold text-slate-500 bg-white/60 px-1.5 py-0.5 rounded border border-slate-200/50 shrink-0">
           {task.temp_id.replace('#', '')}
         </span>
         <span className={`text-[11px] font-bold text-slate-700 leading-snug line-clamp-3 text-left w-full ${textStyle}`} title={task.title}>
           {task.title}
         </span>
      </div>
      
      <Handle type="source" position={Position.Bottom} className={`!w-2 !h-2 !${dotColor} !border-white !border-2 !-mb-1`} />
      
      {/* Tooltip on hover */}
      {isHovered && (
         <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[240px] bg-white border border-slate-200 rounded-lg shadow-xl p-3 z-50 text-left">
            <div className="text-[11px] font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">{task.title}</div>
            <div className="text-[10px] text-slate-600 flex flex-col gap-1">
               <div><span className="font-semibold text-slate-500">Depends on:</span> {task.depends_on?.length ? task.depends_on.join(', ') : 'None'}</div>
               <div><span className="font-semibold text-slate-500">Assignee:</span> {task.suggested_assignee?.member_name || '--'}</div>
               <div><span className="font-semibold text-slate-500">Estimate:</span> {task.estimate_days ? `${task.estimate_days}d` : '--'}</div>
            </div>
         </div>
      )}
    </div>
  );
};

const nodeTypes = {
  customTask: CustomTaskNode,
  divider: ({ data }) => (
    <div style={{ width: data.width }} className="flex items-center justify-center opacity-40">
       <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
       <div className="absolute w-1.5 h-1.5 rotate-45 bg-slate-400 rounded-sm"></div>
    </div>
  )
};

// ─── DAGRE LAYOUT ENGINE ───────────────────────────────────────────────────
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const nodeWidth = 250;
  const nodeHeight = 180;

  // 1. Partition into weakly connected components
  const adjacency = {};
  nodes.forEach(n => { adjacency[n.id] = []; });
  edges.forEach(e => {
     if (adjacency[e.source]) adjacency[e.source].push(e.target);
     if (adjacency[e.target]) adjacency[e.target].push(e.source);
  });

  const visited = new Set();
  const components = [];
  nodes.forEach(n => {
     if (!visited.has(n.id)) {
        const compNodes = [];
        const queue = [n.id];
        visited.add(n.id);
        while(queue.length > 0) {
           const curr = queue.shift();
           compNodes.push(nodes.find(node => node.id === curr));
           adjacency[curr].forEach(neighbor => {
               if (!visited.has(neighbor)) {
                   visited.add(neighbor);
                   queue.push(neighbor);
               }
           });
        }
        components.push(compNodes);
     }
  });

  // 2. Layout each component independently using Dagre
  const layoutedNodes = [];
  let currentX = 50; // Place components horizontally
  let maxGlobalY = 0;

  components.forEach(compNodes => {
      const dg = new dagre.graphlib.Graph();
      dg.setDefaultEdgeLabel(() => ({}));
      // Make lines shorter and more compact! ranksep: 40, nodesep: 30
      dg.setGraph({ rankdir: direction, ranksep: 40, nodesep: 30 });

      const compNodeIds = new Set(compNodes.map(n => n.id));
      
      compNodes.forEach(n => dg.setNode(n.id, { width: nodeWidth, height: nodeHeight }));
      
      edges.forEach(e => {
         if (compNodeIds.has(e.source) && compNodeIds.has(e.target)) {
            dg.setEdge(e.source, e.target);
         }
      });

      dagre.layout(dg);

      let minX = Infinity; let minY = Infinity;
      let maxX = -Infinity; let maxY = -Infinity;

      const compLayout = compNodes.map(n => {
         const pos = dg.node(n.id);
         const x = pos.x - nodeWidth/2;
         const y = pos.y - nodeHeight/2;
         if (x < minX) minX = x;
         if (y < minY) minY = y;
         if (x + nodeWidth > maxX) maxX = x + nodeWidth;
         if (y + nodeHeight > maxY) maxY = y + nodeHeight;
         return { ...n, position: { x, y }, targetPosition: Position.Top, sourcePosition: Position.Bottom };
      });

      // Shift component to currentX
      compLayout.forEach(n => {
         n.position.x = n.position.x - minX + currentX;
         n.position.y = n.position.y - minY + 50; // Align all components at Y=50
         layoutedNodes.push(n);
      });

      const compWidth = maxX - minX;
      currentX += compWidth + 80; // 80px gap between independent components

      const compHeight = maxY - minY;
      if (compHeight > maxGlobalY) maxGlobalY = compHeight;
  });

  const graphWidth = currentX;
  const graphHeight = maxGlobalY + 100;

  return { nodes: layoutedNodes, edges, graphWidth, graphHeight };
};

// ─── GRAPH COMPONENT ───────────────────────────────────────────────────────
const FlowGraphInner = ({ tasks, duplicationRisks, coverageGaps, selectedIndices }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [graphHeight, setGraphHeight] = React.useState(700);
  const [graphWidth, setGraphWidth] = React.useState(1000);

  // Compute base graph layout only when tasks change
  const { initialNodes, initialEdges, layoutHeight, layoutWidth } = useMemo(() => {
    const getNodeId = (task) => `${task.use_case_code || 'global'}_${task.temp_id}`;
    const bypassedIds = new Set();
    
    const tempNodes = tasks.map((task, idx) => {
      const isSelected = selectedIndices ? selectedIndices.has(idx) : true;
      const isDimmed = !isSelected;
      const hasDup = duplicationRisks.some(r => r.generated_task_temp_id === task.temp_id) && !['MERGE_INTO_EXISTING', 'KEEP_BOTH'].includes(task._syncAction);
      
      if (isDimmed || hasDup) {
         bypassedIds.add(getNodeId(task));
      }

      return {
        id: getNodeId(task),
        type: 'customTask',
        data: { task, duplicationRisks, coverageGaps, isDimmed, isHovered: false },
        position: { x: 0, y: 0 }
      };
    });

    const rawEdges = [];
    tasks.forEach(task => {
      if (task.depends_on && Array.isArray(task.depends_on)) {
        task.depends_on.forEach(dep => {
          let depTask = tasks.find(t => t.use_case_code === task.use_case_code && t.temp_id === dep);
          if (!depTask) depTask = tasks.find(t => t.temp_id === dep);
          
          if (depTask) {
            rawEdges.push({
               source: getNodeId(depTask),
               target: getNodeId(task)
            });
          }
        });
      }
    });

    const getEffectiveSources = (nodeId, visited = new Set()) => {
       if (visited.has(nodeId)) return [];
       visited.add(nodeId);
       
       const sources = rawEdges.filter(e => e.target === nodeId).map(e => e.source);
       const effective = [];
       sources.forEach(src => {
           if (!bypassedIds.has(src)) {
               effective.push(src);
           } else {
               effective.push(...getEffectiveSources(src, new Set(visited)));
           }
       });
       return effective;
    };

    const tempEdges = [];
    const addedEdgeKeys = new Set();

    tasks.forEach(task => {
        const targetId = getNodeId(task);
        const isTargetBypassed = bypassedIds.has(targetId);
        const effectiveSources = getEffectiveSources(targetId);
        
        effectiveSources.forEach(sourceId => {
            const edgeKey = `${sourceId}-${targetId}`;
            if (!addedEdgeKeys.has(edgeKey)) {
                addedEdgeKeys.add(edgeKey);
                tempEdges.push({
                  id: `e-${sourceId}-${targetId}`,
                  source: sourceId,
                  target: targetId,
                  type: 'smoothstep',
                  animated: false,
                  style: { 
                    stroke: isTargetBypassed ? '#cbd5e1' : '#94a3b8', 
                    strokeWidth: isTargetBypassed ? 1.5 : 2, 
                    strokeDasharray: isTargetBypassed ? '5 5' : 'none',
                    transition: 'stroke 0.3s, opacity 0.3s' 
                  },
                  markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: isTargetBypassed ? '#cbd5e1' : '#94a3b8' },
                });
            }
        });
    });

    const layouted = getLayoutedElements(tempNodes, tempEdges, 'TB');
    
    // Normalize X and Y to ensure it aligns perfectly with the top-left of the container without cutoffs
    let minX = Infinity;
    let minY = Infinity;
    layouted.nodes.forEach(n => { 
       if (n.position.x < minX) minX = n.position.x;
       if (n.position.y < minY) minY = n.position.y;
    });
    
    layouted.nodes.forEach(n => {
       n.position.x = n.position.x - minX + 50; 
       n.position.y = n.position.y - minY + 50;
    });

    return { 
       initialNodes: layouted.nodes, 
       initialEdges: layouted.edges, 
       layoutHeight: layouted.graphHeight,
       layoutWidth: layouted.graphWidth
    };
  }, [tasks, duplicationRisks, coverageGaps, selectedIndices]);

  // Apply layout
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setGraphHeight(layoutHeight);
    setGraphWidth(layoutWidth);
  }, [initialNodes, initialEdges, layoutHeight, layoutWidth, setNodes, setEdges]);

  // Hover Interaction Logic
  const getConnectedElements = (nodeId) => {
    const connectedNodeIds = new Set([nodeId]);
    const connectedEdgeIds = new Set();
    
    const walkForward = (id) => {
       initialEdges.filter(e => e.source === id).forEach(e => {
          connectedEdgeIds.add(e.id);
          if (!connectedNodeIds.has(e.target)) { connectedNodeIds.add(e.target); walkForward(e.target); }
       });
    };
    const walkBackward = (id) => {
       initialEdges.filter(e => e.target === id).forEach(e => {
          connectedEdgeIds.add(e.id);
          if (!connectedNodeIds.has(e.source)) { connectedNodeIds.add(e.source); walkBackward(e.source); }
       });
    };
    
    walkForward(nodeId);
    walkBackward(nodeId);
    return { connectedNodeIds, connectedEdgeIds };
  };

  const handleNodeMouseEnter = (_, node) => {
    const { connectedNodeIds, connectedEdgeIds } = getConnectedElements(node.id);
    
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, isDimmed: !connectedNodeIds.has(n.id), isHovered: n.id === node.id },
      style: { zIndex: n.id === node.id ? 1000 : (connectedNodeIds.has(n.id) ? 100 : 0) }
    })));
    
    setEdges(eds => eds.map(e => {
      const isConn = connectedEdgeIds.has(e.id);
      return {
        ...e,
        animated: isConn,
        style: { stroke: isConn ? '#1D7A85' : '#cbd5e1', strokeWidth: isConn ? 3 : 2, opacity: isConn ? 1 : 0.2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: isConn ? '#1D7A85' : '#cbd5e1' }
      };
    }));
  };

  const handleNodeMouseLeave = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  };

  return (
    <div className="w-full h-[70vh] relative bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        elementsSelectable={false}
        nodesDraggable={false}
        nodesConnectable={false}
        preventScrolling={false}
        className="bg-transparent"
        fitView
        fitViewOptions={{ padding: 0.1 }}
      >
        <Background color="#ccc" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

const TaskFlowGraph = (props) => {
  return (
    <div className="w-full border border-slate-200 rounded-xl bg-slate-50 shadow-inner relative overflow-hidden">
      <ReactFlowProvider>
        <FlowGraphInner {...props} />
      </ReactFlowProvider>
    </div>
  );
};

export default TaskFlowGraph;
