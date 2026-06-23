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
import GraphToolbar from './GraphToolbar';

const nodeTypes = {
  CLASS: ServiceNode,
  INFRA_GROUP: InfraGroupNode
};


export default function GraphCanvas({ rawNodes, rawEdges, searchQuery, onSearch }) {
  const { 
    setSelectedNode, 
    collapsedZones,
    toggleZoneCollapse
  } = useArchitectureStore();
  
  const { zoomIn, zoomOut, fitView, setCenter } = useReactFlow();
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

  return (
    <div className="w-full h-full flex flex-col gap-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl">
      <GraphToolbar
        onSearch={onSearch}
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onFitView={(opts) => fitView(opts || { padding: 0.2, duration: 800 })}
      />
      <div className="flex-1 min-h-0 border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden relative bg-white dark:bg-slate-900">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.05}
          maxZoom={2.0}
          elevateEdgesOnSelect
          defaultEdgeOptions={{ zIndex: 10 }}
        >
          <Controls showInteractive={false} position="bottom-left" />
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
      </div>
    </div>
  );
}
