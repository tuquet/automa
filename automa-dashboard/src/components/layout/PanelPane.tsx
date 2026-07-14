import * as React from "react"
import { cn } from "@/lib/utils"
import { usePanelStore } from "@/stores/panel"
import { resolvePanelWidget } from "@/registry/panels"
import { X, Plus, Trash2, ChevronUp } from "lucide-react"
import { ActionItem } from "@/components/ui/action-item"
import { useShallow } from "zustand/react/shallow"
import { useTerminalStore } from "@/stores/terminal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator
} from "@/components/ui/context-menu"

export interface PanelPaneProps extends React.HTMLAttributes<HTMLDivElement> {
  // Keeping className for external layout styling
}

export function PanelPane({ className, ...props }: PanelPaneProps) {
  const { tabs, activeTabId, setActiveTab, setPanelOpen, panelPosition, setPanelPosition, panelAlignment, reorderTab } = usePanelStore(
    useShallow((state) => ({
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      setActiveTab: state.setActiveTab,
      setPanelOpen: state.setPanelOpen,
      panelPosition: state.panelPosition,
      setPanelPosition: state.setPanelPosition,
      panelAlignment: state.panelAlignment,
      reorderTab: state.reorderTab
    }))
  )

  const createSession = useTerminalStore((state) => state.createSession);

  const [draggingTabIndex, setDraggingTabIndex] = React.useState<number | null>(null);
  const [dragOffset, setDragOffset] = React.useState<number>(0);
  const [tabWidth, setTabWidth] = React.useState<number>(80);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, index: number) => {
    if (e.button !== 0) return;
    
    const startX = e.clientX;
    const width = e.currentTarget.getBoundingClientRect().width;
    setTabWidth(width || 80);
    setDraggingTabIndex(index);
    setDragOffset(0);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setDragOffset(moveEvent.clientX - startX);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      
      const finalOffset = upEvent.clientX - startX;
      let targetIndex = index + Math.round(finalOffset / (width || 80));
      const currentTabs = usePanelStore.getState().tabs;
      targetIndex = Math.max(0, Math.min(currentTabs.length - 1, targetIndex));
      
      if (index !== targetIndex) {
        usePanelStore.getState().reorderTab(index, targetIndex);
      }
      
      setDraggingTabIndex(null);
      setDragOffset(0);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const currentTargetIndex = draggingTabIndex !== null 
    ? Math.max(0, Math.min(tabs.length - 1, draggingTabIndex + Math.round(dragOffset / tabWidth)))
    : null;

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activeTab = tabs.find(t => t.id === activeTabId)
  const Widget = activeTab ? resolvePanelWidget(activeTab.viewType) : null

  if (!mounted) {
    return <div className={cn("flex flex-col h-full w-full bg-background relative z-0 overflow-hidden", className)} />;
  }

  return (
    <div id="workbench.parts.panel" data-testid="workbench.parts.panel" className={cn("flex flex-col h-full w-full bg-background relative z-0 overflow-hidden", className)} {...props}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {/* Panel Header */}
          <div id="workbench.parts.panel.tabs" data-testid="workbench.parts.panel.tabs" className="flex h-[35px] bg-background items-center justify-between shrink-0 group/header relative border-b border-border">
            
            <div className="flex items-center h-full overflow-x-auto no-scrollbar flex-1 relative z-10 px-2 gap-4">
              {tabs.map((tab, index) => {
                let translateX = 0;
                let isDragging = draggingTabIndex === index;
                
                if (isDragging) {
                  translateX = dragOffset;
                } else if (draggingTabIndex !== null && currentTargetIndex !== null) {
                  if (draggingTabIndex < currentTargetIndex && index > draggingTabIndex && index <= currentTargetIndex) {
                    translateX = -tabWidth;
                  } else if (draggingTabIndex > currentTargetIndex && index >= currentTargetIndex && index < draggingTabIndex) {
                    translateX = tabWidth;
                  }
                }

                return (
                  <div 
                    key={tab.id}
                    onPointerDown={(e) => handlePointerDown(e, index)}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "h-full flex items-center text-[11px] tracking-wide uppercase font-medium cursor-pointer shrink-0 border-b-2 pt-1 relative select-none",
                      activeTabId === tab.id 
                        ? "border-primary text-foreground" 
                        : "border-transparent text-muted-foreground hover:text-foreground",
                      isDragging && "opacity-80 drop-shadow-md z-50 bg-muted/30"
                    )}
                    style={{
                      transform: translateX ? `translateX(${translateX}px)` : undefined,
                      transition: isDragging ? 'none' : 'transform 0.2s ease',
                      touchAction: 'none',
                      zIndex: isDragging ? 50 : 1
                    }}
                  >
                    {tab.title}
                  </div>
                );
              })}
            </div>
            
            {/* Panel Actions */}
            <div id="workbench.parts.panel.actions" data-testid="workbench.parts.panel.actions" className="flex items-center gap-0 px-2 shrink-0 relative z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div>
                    <ActionItem visibility="always" icon={<Plus className="w-4 h-4" />} label="New Session" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => createSession("powershell")}>PowerShell</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => createSession("cmd")}>Command Prompt</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => createSession("git-bash")}>Git Bash</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ActionItem visibility="always" icon={<Trash2 className="w-4 h-4" />} label="Clear" />
              <ActionItem visibility="always" icon={<ChevronUp className="w-4 h-4" />} label="Maximize Panel Size" />
              <ActionItem visibility="always" icon={<X className="w-4 h-4" />} label="Close Panel" onClick={() => setPanelOpen(false)} />
            </div>
          </div>
        </ContextMenuTrigger>
        
        <ContextMenuContent className="w-64">
          {tabs.map(tab => (
             <ContextMenuItem key={tab.id} onClick={() => setActiveTab(tab.id)}>
               {tab.title}
             </ContextMenuItem>
          ))}
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>Panel Position</ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuRadioGroup value={panelPosition} onValueChange={(v) => setPanelPosition(v as any)}>
                <ContextMenuRadioItem value="top">Top</ContextMenuRadioItem>
                <ContextMenuRadioItem value="bottom">Bottom</ContextMenuRadioItem>
                <ContextMenuRadioItem value="left">Left</ContextMenuRadioItem>
                <ContextMenuRadioItem value="right">Right</ContextMenuRadioItem>
              </ContextMenuRadioGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Align Panel</ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuRadioGroup value={panelAlignment} onValueChange={(v) => usePanelStore.getState().setPanelAlignment(v as any)}>
                <ContextMenuRadioItem value="center">Center</ContextMenuRadioItem>
                <ContextMenuRadioItem value="justify">Justify</ContextMenuRadioItem>
              </ContextMenuRadioGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => setPanelOpen(false)}>
            Hide Panel
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      
      {/* Content Area */}
      <div id="workbench.parts.panel.content" data-testid="workbench.parts.panel.content" className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {activeTab && Widget ? (
            <Widget />
          ) : null}
        </div>
      </div>
    </div>
  );
}
