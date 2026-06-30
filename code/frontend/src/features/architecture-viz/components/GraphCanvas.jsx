import React, { useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useArchitectureStore } from '../store/architectureStore';
import useFocusDim from '../hooks/useFocusDim';
import useGraphLayout from '../hooks/useGraphLayout';
import ServiceNode from './nodes/ServiceNode';
import InfraGroupNode from './nodes/InfraGroupNode';
import ElkEdge from './edges/ElkEdge';
import { saveNodePositions } from '../api/architectureApi';
import EdgeLegend from './EdgeLegend';

const nodeTypes = {
  CLASS: ServiceNode,
  INFRA_GROUP: InfraGroupNode
};

const edgeTypes = {
  elk: ElkEdge
};


export default function GraphCanvas({ rawNodes, rawEdges, searchQuery, onSearch }) {
  const { 
    projectId,
    setSelectedNode, 
    collapsedZones,
    toggleZoneCollapse
  } = useArchitectureStore();
  
  const { setCenter, fitBounds } = useReactFlow();

  // Compute an explicit bounding box from ELK-laid-out node data.
  // This bypasses ReactFlow's internal `n.measured` check in fitView(),
  // which only works after the DOM ResizeObserver fires — too late for our async layout.
  const fitToNodes = useCallback((nodeList, opts = {}) => {
    if (!nodeList || nodeList.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodeList.forEach(n => {
      const x = n.position?.x ?? 0;
      const y = n.position?.y ?? 0;
      const w = n.width  ?? n.style?.width  ?? 180;
      const h = n.height ?? n.style?.height ?? 52;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + w > maxX) maxX = x + w;
      if (y + h > maxY) maxY = y + h;
    });
    fitBounds(
      { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      { padding: 0.15, duration: opts.duration ?? 600 }
    );
  }, [fitBounds]);
  const { getLayoutedElements } = useGraphLayout();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Obsidian style focus/dim hook
  const { onNodeClick: focusDimOnNodeClick, onPaneClick } = useFocusDim(nodes, edges, setNodes, setEdges);

  // Filter nodes & edges for rendering
  const { initialNodes, initialEdges } = useMemo(() => {
    const formattedNodes = [];
    const formattedEdges = [];
    
    const searchLower = searchQuery ? searchQuery.toLowerCase() : '';
    const matchesSearch = (node) => {
      if (!searchLower) return true;
      return node.name.toLowerCase().includes(searchLower);
    };

    rawNodes.forEach(node => {
      if (node.layer === 'SYSTEM') {
        if (node.type === 'INFRA_GROUP') {
          formattedNodes.push({
            id: node.nodeId,
            type: 'INFRA_GROUP',
            data: { ...node },
            position: { x: 0, y: 0 }
          });
        } else if (matchesSearch(node)) {
          formattedNodes.push({
            id: node.nodeId,
            type: 'CLASS', // ServiceNode mapped to CLASS
            data: { ...node },
            position: { x: 0, y: 0 }
          });
        }
      }
    });

    rawEdges.forEach(edge => {
      if (edge.layer === 'SYSTEM') {
        formattedEdges.push({
          id: edge.edgeId,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          label: edge.metadata?.label || edge.label || '',
          metadata: { ...edge.metadata }
        });
      }
    });

    return { initialNodes: formattedNodes, initialEdges: formattedEdges };
  }, [rawNodes, rawEdges, searchQuery]);

  // Run Layout calculations asynchronously
  useEffect(() => {
    if (initialNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    let isMounted = true;
    getLayoutedElements(
      initialNodes,
      initialEdges,
      collapsedZones,
      toggleZoneCollapse
    ).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
      if (isMounted) {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        // Auto-center using fitBounds so we don't depend on n.measured being populated.
        // A small delay lets React flush the state update before we read node positions.
        setTimeout(() => fitToNodes(layoutedNodes, { duration: 600 }), 50);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [initialNodes, initialEdges, collapsedZones, toggleZoneCollapse, getLayoutedElements, setNodes, setEdges]);

  // Center node callback
  const handleFocusNode = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const x = node.position.x + 100;
      const y = node.position.y + 40;
      setCenter(x, y, { zoom: 1.0, duration: 800 });
    }
  }, [nodes, setCenter]);

  // Expose focus handler to window
  useEffect(() => {
    window.focusArchitectureNode = handleFocusNode;
    return () => {
      delete window.focusArchitectureNode;
    };
  }, [handleFocusNode]);

  const handleNodeClick = useCallback((event, node) => {
    if (node.type === 'INFRA_GROUP') {
      setSelectedNode(null);
      focusDimOnNodeClick(event, { ...node, id: null }); // resets focus-dim
      return;
    }
    setSelectedNode(node.data);
    focusDimOnNodeClick(event, node);
  }, [setSelectedNode, focusDimOnNodeClick]);

  const handlePaneClick = useCallback((event) => {
    setSelectedNode(null);
    onPaneClick(event);
  }, [setSelectedNode, onPaneClick]);

  // Handler for the Controls "Fit View" button — uses fitBounds for reliability
  const handleFitView = useCallback(() => {
    fitToNodes(nodes);
  }, [fitToNodes, nodes]);

  // Save manual position on drag stop
  const onNodeDragStop = useCallback(async (event, node) => {
    if (!projectId) return;
    try {
      await saveNodePositions(projectId, {
        [node.id]: {
          x: node.position.x,
          y: node.position.y
        }
      });
      // Update local ZUSTAND state immediately to prevent visual jumps on parent re-renders
      const storeGraphData = useArchitectureStore.getState().graphData;
      const updatedPositions = {
        ...(storeGraphData.manualPositions || {}),
        [node.id]: {
          x: node.position.x,
          y: node.position.y
        }
      };
      useArchitectureStore.setState({
        graphData: {
          ...storeGraphData,
          manualPositions: updatedPositions
        }
      });
    } catch (err) {
      console.error('Lỗi khi lưu vị trí node:', err);
    }
  }, [projectId]);

  return (
    <div className="w-full h-full relative bg-white dark:bg-slate-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onNodeDragStop={onNodeDragStop}
        minZoom={0.05}
        maxZoom={2.0}
        elevateEdgesOnSelect
        defaultEdgeOptions={{ zIndex: 10 }}
        proOptions={{ hideAttribution: false }}
      >
        <Controls showInteractive={false} position="bottom-left" onFitView={handleFitView} />
        <MiniMap 
          nodeColor={(n) => {
            if (n.type === 'CLASS') return '#3B82F6'; // Service
            if (n.type === 'INFRA_GROUP') return '#E2E8F0'; // Group box
            return '#94A3B8';
          }}
          maskColor="rgba(0, 0, 0, 0.05)"
          position="bottom-right"
          className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm"
        />
        <Background color="#94a3b8" gap={16} size={1} opacity={0.3} />
      </ReactFlow>
      <EdgeLegend />
    </div>
  );
}
