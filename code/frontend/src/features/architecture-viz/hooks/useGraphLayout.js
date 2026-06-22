import { useCallback } from 'react'
import dagre from 'dagre'

export const useGraphLayout = () => {
  const getLayoutedElements = useCallback((nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph()
    dagreGraph.setDefaultEdgeLabel(() => ({}))
    
    dagreGraph.setGraph({ 
      rankdir: direction, 
      nodesep: 60, 
      ranksep: 80 
    })

    nodes.forEach((node) => {
      let width = 160
      let height = 48
      if (node.type === 'CLASS' || node.type === 'COMPONENT') {
        // ServiceNode or generic large node
        width = 220
        height = 100
      } else if (node.type === 'PACKAGE') {
        // FolderNode
        width = 180
        height = 60
      }
      
      dagreGraph.setNode(node.id, { width, height })
    })

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target)
    })

    dagre.layout(dagreGraph)

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id)
      let offsetWidth = 80
      let offsetHeight = 24
      
      if (node.type === 'CLASS' || node.type === 'COMPONENT') {
        offsetWidth = 110
        offsetHeight = 50
      } else if (node.type === 'PACKAGE') {
        offsetWidth = 90
        offsetHeight = 30
      }
      
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - offsetWidth,
          y: nodeWithPosition.y - offsetHeight,
        },
      }
    })

    return { nodes: layoutedNodes, edges }
  }, [])

  return { getLayoutedElements }
}

export default useGraphLayout
