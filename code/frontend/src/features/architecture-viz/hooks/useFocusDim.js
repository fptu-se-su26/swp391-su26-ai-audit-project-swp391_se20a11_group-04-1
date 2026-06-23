import { useCallback } from 'react'
import { useArchitectureStore } from '../store/architectureStore'

export default function useFocusDim(nodes, edges, setNodes, setEdges) {
  const { setSelectedNode } = useArchitectureStore()

  const focusNode = useCallback((nodeId) => {
    if (!nodeId) {
      const resetNodes = nodes.map(node => ({
        ...node,
        data: { ...node.data, isDimmed: false, isFocused: false }
      }))
      const resetEdges = edges.map(edge => ({
        ...edge,
        style: { ...edge.style, stroke: '#cbd5e1', opacity: 1, strokeWidth: 1.5 },
        animated: false
      }))
      setNodes(resetNodes)
      setEdges(resetEdges)
      return
    }

    const connectedNodeIds = new Set()
    connectedNodeIds.add(nodeId)

    edges.forEach(edge => {
      if (edge.source === nodeId) {
        connectedNodeIds.add(edge.target)
      }
      if (edge.target === nodeId) {
        connectedNodeIds.add(edge.source)
      }
    })

    const updatedNodes = nodes.map(node => {
      const isConnected = connectedNodeIds.has(node.id)
      return {
        ...node,
        data: {
          ...node.data,
          isDimmed: !isConnected,
          isFocused: node.id === nodeId
        }
      }
    })

    const updatedEdges = edges.map(edge => {
      const isConnected = edge.source === nodeId || edge.target === nodeId
      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: isConnected ? '#2196F3' : '#e2e8f0',
          opacity: isConnected ? 1 : 0.15,
          strokeWidth: isConnected ? 2.5 : 1.0
        },
        animated: isConnected
      }
    })

    setNodes(updatedNodes)
    setEdges(updatedEdges)
  }, [nodes, edges, setNodes, setEdges])

  const onNodeClick = useCallback((event, node) => {
    // If it's a child node inside parent container, construct details
    setSelectedNode(node.data)
    focusNode(node.id)
  }, [focusNode, setSelectedNode])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    focusNode(null)
  }, [focusNode, setSelectedNode])

  return { onNodeClick, onPaneClick, focusNode }
}
