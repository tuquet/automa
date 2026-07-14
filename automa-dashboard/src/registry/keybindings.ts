import { useWorkbenchStore } from "@/stores/workbench";
import { usePanelStore } from "@/stores/panel";

export interface Keybinding {
  id: string;
  key: string;            // The key combination, e.g. "ctrl+b", "ctrl+`", "f5"
  when?: string;          // Context condition, e.g. "!inInput"
  command: () => void;    // Action to execute
}

// Helper to normalize keys so "Ctrl+B", "ctrl+b", "Control+b" all match
export const normalizeKey = (e: KeyboardEvent): string => {
  const keys: string[] = [];
  if (e.ctrlKey) keys.push("ctrl");
  if (e.altKey) keys.push("alt");
  if (e.shiftKey) keys.push("shift");
  if (e.metaKey) keys.push("meta");
  
  const key = e.key.toLowerCase();
  // Don't add modifiers as the main key
  if (!["control", "alt", "shift", "meta"].includes(key)) {
    // Standardize some keys
    if (key === " ") keys.push("space");
    else keys.push(key);
  }
  
  return keys.join("+");
};

export const KEYBINDINGS: Keybinding[] = [
  {
    id: "workbench.action.toggleSidebar",
    key: "ctrl+b",
    when: "!inInput", // Do not trigger if typing in an input field
    command: () => useWorkbenchStore.getState().toggleSidebar(),
  },
  {
    id: "workbench.action.togglePanel",
    key: "ctrl+`",
    when: "!inInput",
    command: () => usePanelStore.getState().togglePanel(),
  },
  {
    id: "workbench.action.toggleSecondarySidebar",
    key: "ctrl+alt+b",
    when: "!inInput",
    command: () => useWorkbenchStore.getState().toggleSecondarySidebar(),
  },
  {
    id: "workbench.action.closePanel",
    key: "escape",
    when: "panelFocus && !inInput",
    command: () => usePanelStore.getState().setPanelOpen(false),
  }
];
