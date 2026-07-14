import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: "on" | "off" | "wordWrapColumn" | "bounded";
  minimapEnabled: boolean;
  formatOnSave: boolean;
}

export interface TerminalSettings {
  defaultProfileWindows: string;
  fontFamily: string;
  fontSize: number;
  cursorStyle: "block" | "line" | "underline";
}

export interface WorkbenchSettings {
  colorTheme: string;
  iconTheme: string;
  startupEditor: "newUntitledFile" | "welcomePage" | "none";
  sidebarLocation: "left" | "right";
}

export interface FilesSettings {
  autoSave: "off" | "afterDelay" | "onFocusChange" | "onWindowChange";
  exclude: Record<string, boolean>;
}

export interface SettingsSchema {
  editor: EditorSettings;
  terminal: TerminalSettings;
  workbench: WorkbenchSettings;
  files: FilesSettings;
}

const DEFAULT_SETTINGS: SettingsSchema = {
  editor: {
    fontSize: 14,
    fontFamily: "'Consolas', 'Courier New', monospace",
    tabSize: 2,
    wordWrap: "off",
    minimapEnabled: true,
    formatOnSave: false,
  },
  terminal: {
    defaultProfileWindows: "powershell",
    fontFamily: "'MesloLGS NF', 'Consolas', monospace",
    fontSize: 14,
    cursorStyle: "block",
  },
  workbench: {
    colorTheme: "system",
    iconTheme: "default",
    startupEditor: "welcomePage",
    sidebarLocation: "left",
  },
  files: {
    autoSave: "off",
    exclude: {
      "**/.git": true,
      "**/node_modules": true,
    },
  },
};

interface SettingsStore {
  // Currently applied settings (Merged User + Workspace)
  settings: SettingsSchema;
  
  // Methods to update settings
  updateEditorSettings: (newSettings: Partial<EditorSettings>) => void;
  updateTerminalSettings: (newSettings: Partial<TerminalSettings>) => void;
  updateWorkbenchSettings: (newSettings: Partial<WorkbenchSettings>) => void;
  updateFilesSettings: (newSettings: Partial<FilesSettings>) => void;
  
  // Reset all to default
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      updateEditorSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            editor: { ...state.settings.editor, ...newSettings },
          },
        })),

      updateTerminalSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            terminal: { ...state.settings.terminal, ...newSettings },
          },
        })),

      updateWorkbenchSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            workbench: { ...state.settings.workbench, ...newSettings },
          },
        })),

      updateFilesSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            files: { ...state.settings.files, ...newSettings },
          },
        })),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "automa-ide-settings", // key in localStorage
      storage: createJSONStorage(() => localStorage),
      // Future: Write a custom storage engine that saves to disk using Tauri fs
    }
  )
);
