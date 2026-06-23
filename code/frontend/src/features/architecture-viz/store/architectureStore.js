import { create } from 'zustand'

export const useArchitectureStore = create((set, get) => ({
  projectId: null,
  selectedNode: null,
  hoveredNode: null,
  collapsedZones: new Set(),       // Set of zone IDs that are collapsed (e.g. 'APPLICATION')
  physicsEnabled: false,           // Obsidian physics toggle
  syncStatus: {
    status: 'IDLE',
    progress: 0,
    currentStep: 'Chưa bắt đầu phân tích',
    errorMessage: null
  },
  graphData: { nodes: [], edges: [], stats: {} },
  isLoading: false,

  setProjectId: (projectId) => set({ projectId }),
  setSelectedNode: (selectedNode) => set({ selectedNode }),
  setHoveredNode: (hoveredNode) => set({ hoveredNode }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setGraphData: (graphData) => set({ graphData }),
  setIsLoading: (isLoading) => set({ isLoading }),
  togglePhysics: () => set((state) => ({ physicsEnabled: !state.physicsEnabled })),

  toggleZoneCollapse: (zoneId) => set((state) => {
    const next = new Set(state.collapsedZones)
    if (next.has(zoneId)) {
      next.delete(zoneId)
    } else {
      next.add(zoneId)
    }
    return { collapsedZones: next }
  })
}))
