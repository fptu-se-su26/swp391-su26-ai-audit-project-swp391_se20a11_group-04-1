import { create } from 'zustand'

export const useArchitectureStore = create((set, get) => ({
  projectId: null,
  layer: 'OVERVIEW',
  selectedNode: null,
  hoveredNode: null,
  focusNodeId: null,
  breadcrumbs: [{ layer: 'OVERVIEW', label: 'Tổng quan', id: null }],
  syncStatus: {
    status: 'IDLE',
    progress: 0,
    currentStep: 'Chưa bắt đầu phân tích',
    errorMessage: null
  },
  graphData: { nodes: [], edges: [], stats: {} },
  isLoading: false,
  physicsEnabled: false,

  setProjectId: (projectId) => set({ projectId }),
  setLayer: (layer) => set({ layer }),
  setSelectedNode: (selectedNode) => set({ selectedNode }),
  setHoveredNode: (hoveredNode) => set({ hoveredNode }),
  setFocusNodeId: (focusNodeId) => set({ focusNodeId }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setGraphData: (graphData) => set({ graphData }),
  setIsLoading: (isLoading) => set({ isLoading }),
  togglePhysics: () => set((state) => ({ physicsEnabled: !state.physicsEnabled })),

  setDrillDown: (layer, label, id) => {
    const { breadcrumbs } = get()
    const newBreadcrumbs = [...breadcrumbs, { layer, label, id }]
    set({ layer, focusNodeId: id, breadcrumbs: newBreadcrumbs, selectedNode: null })
  },

  popBreadcrumb: (index) => {
    const { breadcrumbs } = get()
    if (index < 0 || index >= breadcrumbs.length) return
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1)
    const target = newBreadcrumbs[index]
    set({
      layer: target.layer,
      focusNodeId: target.id,
      breadcrumbs: newBreadcrumbs,
      selectedNode: null
    })
  },

  resetBreadcrumbs: () => set({
    layer: 'OVERVIEW',
    focusNodeId: null,
    breadcrumbs: [{ layer: 'OVERVIEW', label: 'Tổng quan', id: null }],
    selectedNode: null
  })
}))
