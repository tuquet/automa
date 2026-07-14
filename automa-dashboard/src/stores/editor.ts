import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface EditorTab {
  id: string;        // Unique key (e.g. 'file:/path', 'app:/rbac')
  title: string;     // Display name on the tab
  viewType: string;  // Key for ViewRegistry
  params?: any;      // Data payload for the widget
  isDirty?: boolean; // Unsaved changes flag
}

interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;

  openTab: (tab: EditorTab) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      tabs: [],
      activeTabId: null,

      openTab: (newTab) => set((state) => {
        const existingIndex = state.tabs.findIndex(t => t.id === newTab.id);
        if (existingIndex >= 0) {
          // Tab already open, just focus it
          return { activeTabId: newTab.id };
        }
        // Open new tab and focus it
        return {
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id
        };
      }),

      closeTab: (id) => set((state) => {
        const tabIndex = state.tabs.findIndex(t => t.id === id);
        if (tabIndex === -1) return state; // Tab not found

        const newTabs = [...state.tabs];
        newTabs.splice(tabIndex, 1);

        let newActiveTabId = state.activeTabId;
        if (state.activeTabId === id) {
          // If we are closing the active tab, pick a new active tab (fallback to previous or next)
          if (newTabs.length > 0) {
            const fallbackIndex = Math.min(tabIndex, newTabs.length - 1);
            newActiveTabId = newTabs[fallbackIndex].id;
          } else {
            newActiveTabId = null;
          }
        }

        return {
          tabs: newTabs,
          activeTabId: newActiveTabId
        };
      }),

      setActiveTab: (id) => set({ activeTabId: id })
    }),
    {
      name: 'automa-editor-storage',
      storage: createJSONStorage(() => typeof window !== 'undefined' ? window.localStorage : ({} as any)),
    }
  )
);
