import { create } from 'zustand';

export interface TerminalSession {
  id: string;
  title: string;
  profile: string; // 'powershell' | 'cmd' | 'git-bash'
}

interface TerminalState {
  sessions: TerminalSession[];
  activeSessionId: string | null;

  createSession: (profile: string) => string;
  removeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  sessions: [],
  activeSessionId: null,

  createSession: (profile: string) => {
    const id = crypto.randomUUID();
    let title = 'PowerShell';
    if (profile === 'cmd') title = 'Command Prompt';
    if (profile === 'git-bash') title = 'Git Bash';

    const newSession: TerminalSession = { id, title, profile };

    set((state) => ({
      sessions: [...state.sessions, newSession],
      activeSessionId: id,
    }));

    return id;
  },

  removeSession: (id: string) => {
    set((state) => {
      const newSessions = state.sessions.filter(s => s.id !== id);
      let newActiveId = state.activeSessionId;
      
      if (newActiveId === id) {
        newActiveId = newSessions.length > 0 ? newSessions[newSessions.length - 1].id : null;
      }

      return {
        sessions: newSessions,
        activeSessionId: newActiveId,
      };
    });
  },

  setActiveSession: (id: string) => set({ activeSessionId: id }),
}));
