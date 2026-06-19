import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useLayoutStore = create(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
    }),
    {
      name: 'layout-storage', // name of the item in the storage (must be unique)
    }
  )
);

export default useLayoutStore;
