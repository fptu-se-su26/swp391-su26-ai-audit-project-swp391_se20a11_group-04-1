import React, { useEffect, useMemo, useCallback } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useArchitectureStore } from '../store/architectureStore'
import useFocusDim from '../hooks/useFocusDim'
import useGraphLayout from '../hooks/useGraphLayout'
import ServiceNode from './nodes/ServiceNode'
import FolderNode from './nodes/FolderNode'
import FileNode from './nodes/FileNode'
import GraphToolbar from './GraphToolbar'

const nodeTypes = {
  CLASS: ServiceNode,
  PACKAGE: FolderNode,
  FILE: FileNode
}

export default function GraphCanvas({ rawNodes, rawEdges, searchQuery, onSearch }) {
  const { 
    activeView, 
    activeServiceId, 
    expandedFolders, 
    setSelectedNode, 
    navigateToService 
  } = useArchitectureStore()
  
  const { zoomIn, zoomOut, fitView, setCenter } = useReactFlow()
  const { getLayoutedElements } = useGraphLayout()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Obsidian style focus/dim hook
  const { onNodeClick: focusDimOnNodeClick, onPaneClick } = useFocusDim(nodes, edges, setNodes, setEdges)

  // Map of raw nodes for quick lookup
  const rawNodesMap = useMemo(() => {
    const map = {}
    rawNodes.forEach(node => {
      map[node.nodeId] = node
    })
    return map
  }, [rawNodes])

  // Helper to recursively check if parent folder is expanded/visible
  const isNodeVisible = useCallback((node) => {
    if (!node.parentId) return true
    if (!expandedFolders.has(node.parentId)) return false
    const parentNode = rawNodesMap[node.parentId]
    if (!parentNode) return true
    return isNodeVisible(parentNode)
  }, [expandedFolders, rawNodesMap])

  // Helper to get nearest visible ancestor ID for collapsed folders redirection
  const getNearestVisibleAncestorId = useCallback((nodeId) => {
    const node = rawNodesMap[nodeId]
    if (!node) return nodeId
    if (isNodeVisible(node)) return nodeId
    if (!node.parentId) return nodeId
    return getNearestVisibleAncestorId(node.parentId)
  }, [isNodeVisible, rawNodesMap])

  // Filter nodes & edges for rendering
  const { initialNodes, initialEdges } = useMemo(() => {
    const formattedNodes = []
    const formattedEdges = []
    
    const searchLower = searchQuery ? searchQuery.toLowerCase() : ''
    const matchesSearch = (node) => {
      if (!searchLower) return true
      return node.name.toLowerCase().includes(searchLower) || 
             (node.filePath && node.filePath.toLowerCase().includes(searchLower))
    }

    if (activeView === 'SYSTEM') {
      // System view: show service nodes and their explicit relationships
      rawNodes.forEach(node => {
        if (node.layer === 'SYSTEM' && matchesSearch(node)) {
          formattedNodes.push({
            id: node.nodeId,
            type: 'CLASS', // ServiceNode mapped to CLASS
            data: { ...node },
            position: { x: 0, y: 0 }
          })
        }
      })

      rawEdges.forEach(edge => {
        if (edge.layer === 'SYSTEM') {
          formattedEdges.push({
            id: edge.edgeId,
            source: edge.source,
            target: edge.target,
            type: 'straight',
            label: edge.metadata?.label || '',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 16,
              height: 16,
              color: '#3B82F6',
            },
            style: {
              strokeWidth: 2,
              stroke: '#3B82F6'
            }
          })
        }
      })
    } else {
      // Internal view: show packages and files belonging to the service
      const serviceNodes = rawNodes.filter(node => {
        if (node.layer !== 'INTERNAL') return false
        const svcId = node.metadata?.serviceId
        return svcId && svcId.toLowerCase() === activeServiceId?.toLowerCase()
      })

      // Filter visible nodes based on expanded folder state
      const visibleRawNodes = serviceNodes.filter(node => isNodeVisible(node))
      const visibleRawNodeIds = new Set(visibleRawNodes.map(n => n.nodeId))

      visibleRawNodes.forEach(node => {
        if (matchesSearch(node)) {
          formattedNodes.push({
            id: node.nodeId,
            type: node.type, // PACKAGE or FILE
            data: { ...node },
            position: { x: 0, y: 0 }
          })
        }
      })

      // Map edges to visible nodes
      rawEdges.forEach(edge => {
        if (edge.layer !== 'INTERNAL') return
        
        // Find visible endpoints by resolving collapsed folders
        const visibleSrc = getNearestVisibleAncestorId(edge.source)
        const visibleTgt = getNearestVisibleAncestorId(edge.target)

        // Only draw if both endpoints are visible, not equal (no self-loops),
        // and both nodes are part of this service
        if (visibleSrc && visibleTgt && visibleSrc !== visibleTgt && 
            visibleRawNodeIds.has(visibleSrc) && visibleRawNodeIds.has(visibleTgt)) {
          
          const edgeId = `redirected:${edge.edgeId}:${visibleSrc}-${visibleTgt}`
          
          // Avoid duplicate redirected edges
          if (!formattedEdges.some(e => e.source === visibleSrc && e.target === visibleTgt)) {
            formattedEdges.push({
              id: edgeId,
              source: visibleSrc,
              target: visibleTgt,
              type: 'straight',
              label: edge.type === 'CONTAINS' ? '' : 'imports',
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 14,
                height: 14,
                color: edge.type === 'CONTAINS' ? '#94a3b8' : '#64748b',
              },
              style: {
                strokeWidth: edge.type === 'CONTAINS' ? 1 : 1.5,
                stroke: edge.type === 'CONTAINS' ? '#94a3b8' : '#64748b',
                strokeDasharray: edge.type === 'CONTAINS' ? '4 4' : undefined
              }
            })
          }
        }
      })
    }

    return { initialNodes: formattedNodes, initialEdges: formattedEdges }
  }, [rawNodes, rawEdges, activeView, activeServiceId, expandedFolders, isNodeVisible, getNearestVisibleAncestorId, searchQuery])

  // Run Layout calculations
  useEffect(() => {
    if (initialNodes.length === 0) {
      setNodes([])
      setEdges([])
      return
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      activeView === 'SYSTEM' ? 'TB' : 'LR' // SYSTEM top-bottom, INTERNAL left-right
    )
    
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [initialNodes, initialEdges, activeView, getLayoutedElements, setNodes, setEdges])

  // Center node callback used by left panel navigator
  const handleFocusNode = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      const x = node.position.x + (node.type === 'CLASS' ? 110 : 90)
      const y = node.position.y + (node.type === 'CLASS' ? 50 : 30)
      setCenter(x, y, { zoom: activeView === 'SYSTEM' ? 1.0 : 1.2, duration: 800 })
    }
  }, [nodes, activeView, setCenter])

  // Expose focus handler to page
  useEffect(() => {
    window.focusArchitectureNode = handleFocusNode
    return () => {
      delete window.focusArchitectureNode
    }
  }, [handleFocusNode])

  const handleNodeClick = useCallback((event, node) => {
    setSelectedNode(node.data)
    focusDimOnNodeClick(event, node)
  }, [setSelectedNode, focusDimOnNodeClick])

  const handlePaneClick = useCallback((event) => {
    setSelectedNode(null)
    onPaneClick(event)
  }, [setSelectedNode, onPaneClick])

  const handleNodeDoubleClick = useCallback((event, node) => {
    if (activeView === 'SYSTEM' && node.type === 'CLASS') {
      navigateToService(node.data.metadata.serviceId, node.data.name)
    }
  }, [activeView, navigateToService])

  return (
    <div className="w-full h-full flex flex-col gap-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl">
      <GraphToolbar
        onSearch={onSearch}
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onFitView={(opts) => fitView(opts || { padding: 0.2, duration: 800 })}
      />
      <div className="flex-1 min-h-0 border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden relative bg-white dark:bg-slate-905">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onPaneClick={handlePaneClick}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          minZoom={0.05}
          maxZoom={2.0}
        >
          <Controls showInteractive={false} position="bottom-left" />
          <MiniMap 
            nodeColor={(n) => {
              if (n.type === 'CLASS') return '#3B82F6' // Service
              if (n.type === 'PACKAGE') return '#F59E0B' // Folder
              return '#10B981' // File
            }}
            maskColor="rgba(0, 0, 0, 0.05)"
            position="bottom-right"
            className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm"
          />
          <Background color="#94a3b8" gap={16} size={1} opacity={0.3} />
        </ReactFlow>
      </div>
    </div>
  )
}
