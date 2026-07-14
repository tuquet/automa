import React from "react";
import dynamic from "next/dynamic";

const XTermWrapper = dynamic(() => import("@/components/terminal/XTermWrapper"), { 
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-zinc-600">
      Loading Terminal...
    </div>
  )
});

import { useTerminalStore } from "@/stores/terminal";
import { useEffect } from "react";
import { Trash2, Plus, Terminal as TerminalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TerminalWidget = () => {
  const { sessions, activeSessionId, createSession, removeSession, setActiveSession } = useTerminalStore();

  return (
    <div className="h-full w-full bg-background relative flex">
      {/* Main Terminal Area */}
      <div className="flex-1 relative h-full p-2">
        {sessions.length === 0 ? (
          <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
            <TerminalIcon className="w-12 h-12 mb-4 opacity-20" />
            <p>No terminal sessions open</p>
            <button 
              onClick={() => createSession("powershell")} 
              className="mt-4 px-4 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors"
            >
              Create New Terminal
            </button>
          </div>
        ) : (
          sessions.map(session => {
            const isActive = session.id === activeSessionId;
            return (
              <div 
                key={session.id} 
                className="absolute inset-0 p-2"
                style={{
                  visibility: isActive ? "visible" : "hidden",
                  zIndex: isActive ? 10 : 0,
                  opacity: isActive ? 1 : 0
                }}
              >
                <XTermWrapper terminalId={session.id} profile={session.profile} />
              </div>
            );
          })
        )}
      </div>

      {/* Right Sidebar - Terminal Sessions */}
      <div className="w-48 shrink-0 border-l border-border flex flex-col bg-muted/20">
        <div className="flex items-center justify-between p-2 border-b border-border">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sessions</span>
          <button onClick={() => createSession("powershell")} className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
          {sessions.map((session, idx) => (
            <div
              key={session.id}
              onClick={() => setActiveSession(session.id)}
              className={cn(
                "group flex items-center justify-between px-2 py-1.5 rounded-sm text-sm cursor-pointer select-none",
                activeSessionId === session.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <TerminalIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{idx + 1}: {session.title}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeSession(session.id); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted-foreground/20 rounded-md transition-opacity"
              >
                <Trash2 className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
const ConsoleWidget = () => (
  <div className="flex h-full w-full items-center justify-center text-zinc-600">
    No console output available
  </div>
);

const ProblemsWidget = () => (
  <div className="flex h-full w-full items-center justify-center text-zinc-600">
    No problems have been detected in the workspace
  </div>
);

const NotFoundWidget = ({ viewType }: { viewType: string }) => (
  <div className="flex h-full w-full items-center justify-center text-destructive">
    No renderer found for viewType: {viewType}
  </div>
);

export const PanelRegistry: Record<string, React.FC<any>> = {
  'terminal': TerminalWidget,
  'console': ConsoleWidget,
  'problems': ProblemsWidget,
};

export const resolvePanelWidget = (viewType: string): React.FC<any> => {
  return PanelRegistry[viewType] || NotFoundWidget;
};
