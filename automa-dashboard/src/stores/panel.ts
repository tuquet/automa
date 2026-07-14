import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { PanelPosition, PanelAlignment } from "@/components/layout/PanelContainer";

export interface PanelTab {
  id: string;        // Unique key (e.g. 'terminal', 'console', 'problems')
  title: string;     // Display name on the tab
  viewType: string;  // Key for PanelRegistry
}

interface PanelState {
  tabs: PanelTab[];
  activeTabId: string;
  isPanelOpen: boolean;
  panelSize: number;
  panelPosition: PanelPosition;
  panelAlignment: PanelAlignment;
  terminalProfile: string;

  togglePanel: () => void;
  setPanelOpen: (isOpen: boolean) => void;
  setPanelSize: (size: number) => void;
  setPanelPosition: (position: PanelPosition) => void;
  setPanelAlignment: (alignment: PanelAlignment) => void;
  setActiveTab: (id: string) => void;
  setTerminalProfile: (profile: string) => void;
  reorderTab: (sourceIndex: number, destinationIndex: number) => void;
}

export const usePanelStore = create<PanelState>()(
  persist(
    (set) => ({
      isPanelOpen: true,
      panelSize: 300,
      panelPosition: 'bottom',
      panelAlignment: 'center',
      terminalProfile: 'powershell',
      tabs: [
        { id: 'terminal', title: 'Terminal', viewType: 'terminal' },
        { id: 'console', title: 'Console', viewType: 'console' },
        { id: 'problems', title: 'Problems', viewType: 'problems' },
      ],
      activeTabId: 'terminal',

      togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
      
      setPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),
      
      setPanelSize: (size) => set({ panelSize: size }),

      setPanelPosition: (position) => set({ panelPosition: position }),

      setPanelAlignment: (alignment) => set({ panelAlignment: alignment }),
      
      setActiveTab: (id) => set({ activeTabId: id, isPanelOpen: true }),

      setTerminalProfile: (profile) => set({ terminalProfile: profile }),

      reorderTab: (sourceIndex, destinationIndex) => set((state) => {
        const newTabs = [...state.tabs];
        const [movedTab] = newTabs.splice(sourceIndex, 1);
        newTabs.splice(destinationIndex, 0, movedTab);
        return { tabs: newTabs };
      })
    }),
    {
      name: 'automa-panel-storage',
      storage: createJSONStorage(() => typeof window !== 'undefined' ? window.localStorage : ({} as any)),
    }
  )
);
