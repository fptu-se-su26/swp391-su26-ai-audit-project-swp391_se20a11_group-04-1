import { create } from 'zustand'

export const useArchitectureStore = create((set, get) => ({
  projectId: null,
  activeView: 'SYSTEM',            // 'SYSTEM' | 'INTERNAL'
  activeServiceId: null,           // e.g. 'backend'
  selectedNode: null,
  hoveredNode: null,
  expandedFolders: new Set(),      // Set of folder IDs that are expanded
  breadcrumbs: [{ view: 'SYSTEM', label: 'Hệ thống', serviceId: null }],
  syncStatus: {
    status: 'IDLE',
    progress: 0,
    currentStep: 'Chưa bắt đầu phân tích',
    errorMessage: null
  },
  graphData: { nodes: [], edges: [], stats: {} },
  isLoading: false,

  setProjectId: (projectId) => set({ projectId }),
  setActiveView: (activeView) => set({ activeView }),
  setActiveServiceId: (activeServiceId) => set({ activeServiceId }),
  setSelectedNode: (selectedNode) => set({ selectedNode }),
  setHoveredNode: (hoveredNode) => set({ hoveredNode }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setGraphData: (graphData) => set({ graphData }),
  setIsLoading: (isLoading) => set({ isLoading }),

  toggleFolder: (folderId) => set((state) => {
    const next = new Set(state.expandedFolders)
    if (next.has(folderId)) {
      next.delete(folderId)
    } else {
      next.add(folderId)
    }
    return { expandedFolders: next }
  }),

  expandAllFolders: (folderIds) => set({ expandedFolders: new Set(folderIds) }),
  collapseAllFolders: () => set({ expandedFolders: new Set() }),

  navigateToService: (serviceId, serviceName) => {
    set({
      activeView: 'INTERNAL',
      activeServiceId: serviceId,
      selectedNode: null,
      expandedFolders: new Set(),
      breadcrumbs: [
        { view: 'SYSTEM', label: 'Hệ thống', serviceId: null },
        { view: 'INTERNAL', label: serviceName || serviceId, serviceId }
      ]
    })
  },

  navigateToSystem: () => {
    set({
      activeView: 'SYSTEM',
      activeServiceId: null,
      selectedNode: null,
      expandedFolders: new Set(),
      breadcrumbs: [{ view: 'SYSTEM', label: 'Hệ thống', serviceId: null }]
    })
  },

  popBreadcrumb: (index) => {
    const { breadcrumbs } = get()
    if (index === 0) {
      get().navigateToSystem()
    } else if (index === 1) {
      const target = breadcrumbs[1]
      get().navigateToService(target.serviceId, target.label)
    }
  }
}))

