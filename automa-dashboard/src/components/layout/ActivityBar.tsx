import React, { useState } from "react";
import { Database, FolderGit2, Package, Settings, Search, Play } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useWorkbenchStore, ActivityId } from "@/stores/workbench";
import { useShallow } from "zustand/react/shallow";

import { useEditorStore } from "@/stores/editor";

const ACTIVITY_METADATA: Record<string, { icon: any, label: string }> = {
  explorer: { icon: Database, label: "Explorer (Ctrl+Shift+E)" },
  search: { icon: Search, label: "Search (Ctrl+Shift+F)" },
  workflows: { icon: FolderGit2, label: "Workflows" },
  run: { icon: Play, label: "Run and Debug (Ctrl+Shift+D)" },
  extensions: { icon: Package, label: "Extensions (Ctrl+Shift+X)" }
};

export function ActivityBar() {
  const { activeActivity, setActiveActivity, activityOrder, reorderActivity } = useWorkbenchStore(
    useShallow((state) => ({
      activeActivity: state.activeActivity,
      setActiveActivity: state.setActiveActivity,
      activityOrder: state.activityOrder,
      reorderActivity: state.reorderActivity
    }))
  );

  const openTab = useEditorStore((state) => state.openTab);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const ITEM_SIZE = 48; // ActivityBar items are 48x48

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    if (e.button !== 0) return; // Only allow left click
    
    const startY = e.clientY;
    setDraggingIndex(index);
    setDragOffset(0);

    // Attach to window so we can drag outside the element
    const handlePointerMove = (moveEvent: PointerEvent) => {
      setDragOffset(moveEvent.clientY - startY);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      
      const finalOffset = upEvent.clientY - startY;
      let targetIndex = index + Math.round(finalOffset / ITEM_SIZE);
      const currentOrder = useWorkbenchStore.getState().activityOrder;
      targetIndex = Math.max(0, Math.min(currentOrder.length - 1, targetIndex));
      
      if (index !== targetIndex) {
        useWorkbenchStore.getState().reorderActivity(index, targetIndex);
      }
      
      setDraggingIndex(null);
      setDragOffset(0);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const currentTargetIndex = draggingIndex !== null 
    ? Math.max(0, Math.min(activityOrder.length - 1, draggingIndex + Math.round(dragOffset / ITEM_SIZE)))
    : null;

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[48px] shrink-0 border-r border-border bg-background" />;
  }

  return (
    <div 
      id="workbench.parts.activitybar" 
      data-testid="workbench.parts.activitybar" 
      className="w-[48px] shrink-0 border-r border-border bg-background flex flex-col items-center z-20 select-none relative"
    >
      <TooltipProvider delayDuration={0}>
        {/* Render Top Activities based on user-defined order */}
        {activityOrder.map((id, index) => {
          const meta = ACTIVITY_METADATA[id];
          if (!meta) return null;

          let translateY = 0;
          let isDragging = draggingIndex === index;
          
          // Calculate shift for siblings
          if (isDragging) {
            translateY = dragOffset;
          } else if (draggingIndex !== null && currentTargetIndex !== null) {
            if (draggingIndex < currentTargetIndex && index > draggingIndex && index <= currentTargetIndex) {
              translateY = -ITEM_SIZE;
            } else if (draggingIndex > currentTargetIndex && index >= currentTargetIndex && index < draggingIndex) {
              translateY = ITEM_SIZE;
            }
          }

          return (
            <ActivityBarItem 
              key={id}
              id={id as ActivityId} 
              icon={meta.icon} 
              label={meta.label} 
              isActive={activeActivity === id} 
              onClick={() => setActiveActivity(id as ActivityId)} 
              onPointerDown={(e) => handlePointerDown(e, index)}
              style={{
                transform: translateY ? `translateY(${translateY}px)` : undefined,
                zIndex: isDragging ? 50 : 1,
                transition: (draggingIndex !== null && !isDragging) ? 'transform 0.2s ease' : 'none',
              }}
              isDragging={isDragging}
            />
          );
        })}
        
        <div className="flex-1" />
        
        {/* Bottom Settings Menu (Not draggable) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="w-full flex justify-center mb-2 outline-none">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-[48px] h-[48px] flex items-center justify-center cursor-pointer relative text-muted-foreground hover:text-foreground outline-none">
                    <Settings className="w-6 h-6 stroke-[1.5]" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={4} className="px-3 py-1.5 text-xs font-medium bg-popover text-popover-foreground border border-border shadow-md [&>svg]:hidden">
                  Manage
                </TooltipContent>
              </Tooltip>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" alignOffset={-10} className="w-56">
            <DropdownMenuItem onClick={() => { /* open command palette */ }}>
              Command Palette...
              <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+P</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { 
              openTab({
                id: "workbench.settings",
                title: "Settings",
                viewType: "settings",
                isDirty: false
              })
            }}>
              Settings
              <span className="ml-auto text-xs text-muted-foreground">Ctrl+,</span>
            </DropdownMenuItem>
            <DropdownMenuItem>Extensions</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Keyboard Shortcuts</DropdownMenuItem>
            <DropdownMenuItem>Color Theme</DropdownMenuItem>
            <DropdownMenuItem>File Icon Theme</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  );
}

interface ActivityBarItemProps {
  id: ActivityId;
  icon: any;
  label: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
  onPointerDown?: (e: React.PointerEvent) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
}

function ActivityBarItem({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick, 
  className,
  onPointerDown,
  style,
  isDragging
}: ActivityBarItemProps) {
  return (
    <div
      onPointerDown={onPointerDown}
      style={{ touchAction: 'none', ...style }}
      className="relative"
    >
      <Tooltip open={isDragging ? false : undefined}>
        <TooltipTrigger asChild>
          <div 
            onClick={onClick}
            className={cn(
              "w-[48px] h-[48px] flex items-center justify-center cursor-pointer relative text-muted-foreground hover:text-foreground transition-colors duration-200",
              isActive && "text-foreground",
              isDragging && "opacity-80 drop-shadow-md bg-muted/30",
              className
            )}
          >
            {isActive && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary" />}
            <Icon className="w-6 h-6 stroke-[1.5]" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={4} className="px-3 py-1.5 text-xs font-medium bg-popover text-popover-foreground border border-border shadow-md [&>svg]:hidden">
          {label}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
