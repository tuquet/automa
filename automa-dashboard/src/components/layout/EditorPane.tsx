import * as React from "react"
import { cn } from "@/lib/utils"
import { useEditorStore } from "@/stores/editor"
import { resolveViewWidget } from "@/registry/views"
import { X, Play, PanelRight, MoreHorizontal, Circle } from "lucide-react"
import { ActionItem } from "@/components/ui/action-item"
import { useShallow } from "zustand/react/shallow"

export interface EditorPaneProps extends React.HTMLAttributes<HTMLDivElement> {
  // We keep className in case the parent needs to inject styles
}

export function EditorPane({ className, ...props }: EditorPaneProps) {
  const { tabs, activeTabId, setActiveTab, closeTab } = useEditorStore(
    useShallow((state) => ({
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      setActiveTab: state.setActiveTab,
      closeTab: state.closeTab
    }))
  )

  // Resolve the active tab's component
  const activeTab = tabs.find(t => t.id === activeTabId)
  const Widget = activeTab ? resolveViewWidget(activeTab.viewType) : null

  return (
    <div id="workbench.parts.editor" data-testid="workbench.parts.editor" className={cn("flex flex-col h-full w-full bg-background relative z-0 overflow-hidden", className)} {...props}>
      {/* Tabs Header */}
      <div id="workbench.parts.editor.tabs" data-testid="workbench.parts.editor.tabs" className="flex h-[35px] bg-muted/30 items-center justify-between shrink-0 group/header relative">
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-border pointer-events-none z-0" />
        
        <div className="flex items-center h-full overflow-x-auto no-scrollbar flex-1 relative z-10">
          {tabs.map((tab) => (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "h-full px-3 flex items-center gap-1.5 text-[13px] cursor-pointer group/tab shrink-0 min-w-[120px] max-w-[200px] border-r border-r-border",
                activeTabId === tab.id 
                  ? "bg-background border-t-[1px] border-t-primary text-foreground" 
                  : "bg-transparent border-t-[1px] border-t-transparent text-muted-foreground hover:bg-muted/10"
              )}
            >
              <span className="truncate flex-1 select-none">{tab.title}</span>
              <div 
                className="w-5 h-5 flex items-center justify-center shrink-0 rounded-sm hover:bg-muted/50 text-muted-foreground group-hover/tab:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                {tab.isDirty ? (
                  <Circle className="w-2.5 h-2.5 fill-current" />
                ) : (
                  <X className="w-3.5 h-3.5 opacity-0 group-hover/tab:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Editor Title Actions */}
        <div id="workbench.parts.editor.actions" data-testid="workbench.parts.editor.actions" className="flex items-center gap-0 px-2 shrink-0 relative z-10">
          <ActionItem visibility="always" icon={<Play className="w-4 h-4 text-green-500" />} label="Run Workflow" />
          <ActionItem visibility="always" icon={<PanelRight className="w-4 h-4" />} label="Split Editor Right" />
          <ActionItem visibility="always" icon={<MoreHorizontal className="w-4 h-4" />} label="More Actions" />
        </div>
      </div>
      
      {/* Content Area */}
      <div id="workbench.parts.editor.content" data-testid="workbench.parts.editor.content" className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab && Widget ? (
          <Widget {...activeTab.params} />
        ) : (
          <div className="flex flex-col h-full w-full items-center justify-center select-none bg-background">
            <div className="flex items-center justify-center opacity-[0.03] dark:opacity-[0.05] pointer-events-none absolute inset-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="m10 13-2 2 2 2" />
                <path d="m14 17 2-2-2-2" />
              </svg>
            </div>
            
            <div className="z-10 flex flex-col gap-3 mt-32 text-[13px] text-muted-foreground/80 font-medium">
              <div className="flex items-center gap-6 justify-between">
                <span>Open Chat</span>
                <span className="flex items-center gap-1 font-mono text-[11px] bg-muted/40 px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground">
                  <span className="opacity-80">Ctrl</span>+<span className="opacity-80">Alt</span>+<span className="opacity-80">I</span>
                </span>
              </div>
              <div className="flex items-center gap-6 justify-between">
                <span>Show All Commands</span>
                <span className="flex items-center gap-1 font-mono text-[11px] bg-muted/40 px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground">
                  <span className="opacity-80">Ctrl</span>+<span className="opacity-80">Shift</span>+<span className="opacity-80">P</span>
                </span>
              </div>
              <div className="flex items-center gap-6 justify-between">
                <span>Find in Files</span>
                <span className="flex items-center gap-1 font-mono text-[11px] bg-muted/40 px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground">
                  <span className="opacity-80">Ctrl</span>+<span className="opacity-80">Shift</span>+<span className="opacity-80">F</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
