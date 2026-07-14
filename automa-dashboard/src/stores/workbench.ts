import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ActivityId = 'explorer' | 'search' | 'workflows' | 'run' | 'extensions' | 'settings';

interface WorkbenchState {
  activeActivity: ActivityId;
  isSidebarOpen: boolean;
  sidebarWidth: number;
  lastSidebarWidth: number;
  
  isSecondarySidebarOpen: boolean;
  secondarySidebarWidth: number;
  lastSecondarySidebarWidth: number;
  
  activityOrder: ActivityId[];

  setActiveActivity: (id: ActivityId) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  toggleSecondarySidebar: () => void;
  setSecondarySidebarWidth: (width: number) => void;
  reorderActivity: (sourceIndex: number, destinationIndex: number) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useWorkbenchStore = create<WorkbenchState>()(
  persist(
    (set) => ({
      activeActivity: 'explorer',
      isSidebarOpen: true,
      sidebarWidth: 250,
      lastSidebarWidth: 250,

      isSecondarySidebarOpen: false,
      secondarySidebarWidth: 250,
      lastSecondarySidebarWidth: 250,
      
      activityOrder: ['explorer', 'search', 'workflows', 'run', 'extensions'],
      
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setActiveActivity: (id) => set((state) => {
        if (state.activeActivity === id) {
          const newIsOpen = !state.isSidebarOpen;
          return { 
            isSidebarOpen: newIsOpen,
            sidebarWidth: newIsOpen ? (state.lastSidebarWidth > 0 ? state.lastSidebarWidth : 250) : 0
          };
        } else {
          return { 
            activeActivity: id, 
            isSidebarOpen: true,
            sidebarWidth: state.sidebarWidth > 0 ? state.sidebarWidth : (state.lastSidebarWidth > 0 ? state.lastSidebarWidth : 250)
          };
        }
      }),

      toggleSidebar: () => set((state) => {
        const newIsOpen = !state.isSidebarOpen;
        return {
          isSidebarOpen: newIsOpen,
          sidebarWidth: newIsOpen ? (state.lastSidebarWidth > 0 ? state.lastSidebarWidth : 250) : 0
        };
      }),

      setSidebarWidth: (width) => set((state) => {
        const isSidebarOpen = width > 0;
        return {
          sidebarWidth: width,
          isSidebarOpen,
          lastSidebarWidth: isSidebarOpen ? width : state.lastSidebarWidth
        };
      }),

      toggleSecondarySidebar: () => set((state) => {
        const newIsOpen = !state.isSecondarySidebarOpen;
        return {
          isSecondarySidebarOpen: newIsOpen,
          secondarySidebarWidth: newIsOpen ? (state.lastSecondarySidebarWidth > 0 ? state.lastSecondarySidebarWidth : 250) : 0
        };
      }),

      setSecondarySidebarWidth: (width) => set((state) => {
        const isSecondarySidebarOpen = width > 0;
        return {
          secondarySidebarWidth: width,
          isSecondarySidebarOpen,
          lastSecondarySidebarWidth: isSecondarySidebarOpen ? width : state.lastSecondarySidebarWidth
        };
      }),

      reorderActivity: (sourceIndex, destinationIndex) => set((state) => {
        const newOrder = [...state.activityOrder];
        const [movedItem] = newOrder.splice(sourceIndex, 1);
        newOrder.splice(destinationIndex, 0, movedItem);
        return { activityOrder: newOrder };
      })
    }),
    {
      name: 'automa-workbench-storage',
      storage: createJSONStorage(() => typeof window !== 'undefined' ? window.localStorage : ({} as any)),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
