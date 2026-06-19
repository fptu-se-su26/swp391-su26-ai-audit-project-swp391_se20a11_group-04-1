import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useArchitectureStore } from '../store/architectureStore'
import useFocusDim from '../hooks/useFocusDim'
import PackageNode from './nodes/PackageNode'
import ClassNode from './nodes/ClassNode'
import ClassContainerNode from './nodes/ClassContainerNode'
import MethodNode from './nodes/MethodNode'

import dagre from 'dagre'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceX, forceY } from 'd3-force'

const nodeTypes = {
  PACKAGE: PackageNode,
  FILE: PackageNode,
  CLASS: ClassNode,
  INTERFACE: ClassNode,
  COMPONENT: ClassNode,
  HOOK: ClassNode,
  CLASS_CONTAINER: ClassContainerNode,
  METHOD: MethodNode,
}

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  
  dagreGraph.setGraph({ 
    rankdir: direction, 
    nodesep: 80, 
    ranksep: 120 
  })

  nodes.forEach((node) => {
    let width = 180
    let height = 60
    if (node.type === 'CLASS_CONTAINER') {
      width = node.style?.width || 220
      height = node.style?.height || 250
    } else if (node.type === 'METHOD') {
      width = 140
      height = 36
    }
    
    dagreGraph.setNode(node.id, { width, height })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    if (node.parentId) {
      return node
    }
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (node.type === 'CLASS_CONTAINER' ? 110 : 90),
        y: nodeWithPosition.y - 30,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

export default function GraphCanvas({ rawNodes, rawEdges, searchQuery }) {
  const { physicsEnabled, setSelectedNode, layer } = useArchitectureStore()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [collapsedContainers, setCollapsedContainers] = useState(new Set())

  const { onNodeClick, onPaneClick, focusNode } = useFocusDim(nodes, edges, setNodes, setEdges)

  const handleToggleCollapse = useCallback((containerId, isCollapsed) => {
    setCollapsedContainers((prev) => {
      const next = new Set(prev)
      if (isCollapsed) {
        next.add(containerId)
      } else {
        next.delete(containerId)
      }
      return next
    })
  }, [])

  const { initialNodes, initialEdges } = useMemo(() => {
    const formattedNodes = []
    const formattedEdges = []

    const searchLower = searchQuery ? searchQuery.toLowerCase() : ''
    const matchesSearch = (node) => {
      if (!searchLower) return true
      return node.name.toLowerCase().includes(searchLower) || 
             (node.filePath && node.filePath.toLowerCase().includes(searchLower))
    }

    if (layer === 'FLOW') {
      const classes = rawNodes.filter(n => n.type === 'CLASS' || n.type === 'INTERFACE')
      const methods = rawNodes.filter(n => n.type === 'METHOD' || n.type === 'FUNCTION')

      classes.forEach((cls) => {
        if (!matchesSearch(cls)) return
        const isCollapsed = collapsedContainers.has(cls.nodeId)
        const classMethods = methods.filter(m => m.parentId === cls.nodeId)
        
        const containerWidth = 220
        const containerHeight = isCollapsed ? 48 : 50 + classMethods.length * 54

        formattedNodes.push({
          id: cls.nodeId,
          type: 'CLASS_CONTAINER',
          data: { 
            ...cls,
            onToggleCollapse: handleToggleCollapse 
          },
          style: { width: containerWidth, height: containerHeight },
          position: { x: 0, y: 0 }
        })

        if (!isCollapsed) {
          classMethods.forEach((method, idx) => {
            formattedNodes.push({
              id: method.nodeId,
              type: 'METHOD',
              parentId: cls.nodeId,
              extent: 'parent',
              data: { ...method },
              position: { x: 40, y: 46 + idx * 54 },
              style: { zIndex: 10 }
            })
          })
        }
      })
    } else {
      rawNodes.forEach((node) => {
        if (!matchesSearch(node)) return
        formattedNodes.push({
          id: node.nodeId,
          type: node.type,
          data: { ...node },
          position: { x: 0, y: 0 }
        })
      })
    }

    rawEdges.forEach((edge) => {
      if (layer === 'FLOW' && edge.type === 'CONTAINS') {
        return
      }
      
      formattedEdges.push({
        id: edge.edgeId,
        source: edge.source,
        target: edge.target,
        type: 'default',
        label: edge.metadata?.label || '',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#cbd5e1',
        },
        style: {
          strokeWidth: 1.5,
          stroke: '#cbd5e1'
        }
      })
    })

    return { initialNodes: formattedNodes, initialEdges: formattedEdges }
  }, [rawNodes, rawEdges, layer, collapsedContainers, handleToggleCollapse, searchQuery])

  useEffect(() => {
    if (initialNodes.length === 0) return

    if (!physicsEnabled) {
      const dir = layer === 'FLOW' ? 'LR' : 'TB'
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges,
        dir
      )
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
    } else {
      const nodesToSimulate = initialNodes.map(n => ({ ...n, x: Math.random() * 500, y: Math.random() * 400 }))
      const linksToSimulate = initialEdges.map(e => ({ ...e, source: e.source, target: e.target }))
      
      const simulation = forceSimulation(nodesToSimulate.filter(n => !n.parentId))
        .force('link', forceLink(linksToSimulate).id(d => d.id).distance(180))
        .force('charge', forceManyBody().strength(-300))
        .force('center', forceCenter(400, 300))
        .force('x', forceX().strength(0.05))
        .force('y', forceY().strength(0.05))

      simulation.on('tick', () => {
        setNodes((prevNodes) =>
          prevNodes.map((node) => {
            const simNode = nodesToSimulate.find((n) => n.id === node.id)
            if (simNode) {
              return {
                ...node,
                position: { x: simNode.x, y: simNode.y }
              }
            }
            return node
          })
        )
      })

      return () => simulation.stop()
    }
  }, [initialNodes, initialEdges, physicsEnabled, setNodes, setEdges, layer])

  return (
    <div className="w-full h-full bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.1}
        maxZoom={2.0}
      >
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap 
          nodeColor={(n) => {
            if (n.type === 'CLASS_CONTAINER') return '#e2e8f0'
            return '#2196F3'
          }}
          maskColor="rgba(0, 0, 0, 0.05)"
          position="bottom-right"
          className="border border-outline-variant/30 rounded-lg overflow-hidden shadow-sm"
        />
        <Background color="#cbd5e1" gap={16} size={1} />
      </ReactFlow>
    </div>
  )
}
