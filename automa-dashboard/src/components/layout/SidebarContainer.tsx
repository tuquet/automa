import React, { useCallback } from "react";
import { useWorkbenchStore } from "@/stores/workbench";
import { usePanelStore } from "@/stores/panel";
import { SidebarRegistry } from "@/registry/sidebars";
import { useShallow } from "zustand/react/shallow";

export function SidebarContainer() {
  const { activeActivity, isSidebarOpen, sidebarWidth, setSidebarWidth } = useWorkbenchStore(
    useShallow((state) => ({
      activeActivity: state.activeActivity,
      isSidebarOpen: state.isSidebarOpen,
      sidebarWidth: state.sidebarWidth,
      setSidebarWidth: state.setSidebarWidth,
    }))
  );

  const { isPanelOpen, panelSize, panelPosition, panelAlignment } = usePanelStore(
    useShallow((state) => ({
      isPanelOpen: state.isPanelOpen,
      panelSize: state.panelSize,
      panelPosition: state.panelPosition,
      panelAlignment: state.panelAlignment,
    }))
  );

  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const ActiveSidebar = SidebarRegistry[activeActivity];

  const startSidebarResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarRef.current ? sidebarRef.current.offsetWidth : (sidebarWidth > 0 ? sidebarWidth : 250);
    let finalWidth = startWidth;
    let animationFrameId: number;
    
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      
      animationFrameId = requestAnimationFrame(() => {
        let newWidth = startWidth + (moveEvent.clientX - startX);
        
        if (newWidth < 120) {
          newWidth = 0; 
        } else if (newWidth >= 120 && newWidth < 160) {
          newWidth = 160; 
        } else if (newWidth > 800) {
          newWidth = 800;
        }
        
        finalWidth = newWidth;
        if (sidebarRef.current) {
          sidebarRef.current.style.width = `${newWidth}px`;
        }

        // Push Editor bounds
        const editorContainer = document.getElementById("workbench-editor-container");
        const pStore = usePanelStore.getState();
        if (editorContainer) {
          let editorLeft = newWidth;
          if (pStore.isPanelOpen && pStore.panelPosition === 'left') {
             editorLeft += pStore.panelSize;
          }
          editorContainer.style.left = `${editorLeft}px`;
        }

        // Push Panel bounds if Panel is Center
        if (pStore.isPanelOpen && pStore.panelAlignment === 'center' && (pStore.panelPosition === 'bottom' || pStore.panelPosition === 'top')) {
          const panelContainer = document.getElementById("workbench-panel-container");
          if (panelContainer) {
            panelContainer.style.left = `${newWidth}px`;
          }
        }
      });
    };
    
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      document.body.style.userSelect = "";
      document.body.style.cursor = "default";
      document.body.style.pointerEvents = "";
      
      setSidebarWidth(finalWidth);
    };
    
    document.body.style.pointerEvents = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [sidebarWidth, setSidebarWidth]);

  if (!isSidebarOpen) return null;

  let bottom = 0;
  let top = 0;
  
  if (isPanelOpen && panelAlignment === 'justify') {
     if (panelPosition === 'bottom') bottom = panelSize;
     else if (panelPosition === 'top') top = panelSize;
  }

  return (
    <div 
      id="workbench-sidebar-container"
      ref={sidebarRef}
      className="absolute left-0 flex flex-col overflow-hidden bg-background shrink-0 z-10" 
      style={{ 
        width: sidebarWidth, 
        borderRight: '1px solid var(--border)', 
        contain: 'strict',
        top,
        bottom
      }}
    >
      {ActiveSidebar && <ActiveSidebar />}
      
      <div 
        className="absolute right-0 top-0 bottom-0 w-[1px] bg-border hover:bg-primary/50 cursor-col-resize shrink-0 z-20 hover:w-[4px] hover:-mr-[1.5px] transition-colors pointer-events-auto"
        onMouseDown={startSidebarResize}
      />
    </div>
  );
}
