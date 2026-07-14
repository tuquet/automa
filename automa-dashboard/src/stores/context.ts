import { create } from "zustand";

interface ContextState {
  // A set of active context keys, e.g., 'inInput', 'sidebarFocus', 'panelFocus'
  activeContexts: Set<string>;
  
  // Add a context flag
  setContext: (key: string, value: boolean) => void;
  
  // Check if a context flag is active
  hasContext: (key: string) => boolean;
  
  // Evaluate a 'when' expression against the active contexts
  // Example: "inInput", "!inInput", "editorFocus && !inInput"
  evaluateContext: (when?: string) => boolean;
}

export const useContextStore = create<ContextState>((set, get) => ({
  activeContexts: new Set<string>(),

  setContext: (key: string, value: boolean) => {
    set((state) => {
      const newSet = new Set(state.activeContexts);
      if (value) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
      return { activeContexts: newSet };
    });
  },

  hasContext: (key: string) => {
    return get().activeContexts.has(key);
  },

  evaluateContext: (when?: string) => {
    if (!when) return true; // If no condition is provided, it always passes

    // Simple evaluator for boolean logic. 
    // Example format: "!inInput" or "editorFocus && !isReadonly"
    const conditions = when.split("&&").map(c => c.trim());
    
    const { activeContexts } = get();
    
    for (const condition of conditions) {
      const isNegated = condition.startsWith("!");
      const key = isNegated ? condition.slice(1) : condition;
      
      const isPresent = activeContexts.has(key);
      
      if (isNegated && isPresent) return false;
      if (!isNegated && !isPresent) return false;
    }
    
    return true;
  }
}));
