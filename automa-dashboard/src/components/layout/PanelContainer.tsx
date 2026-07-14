import React, { useCallback, useRef, useEffect } from "react";
import { usePanelStore } from "@/stores/panel";
import { useWorkbenchStore } from "@/stores/workbench";
import { useShallow } from "zustand/react/shallow";
import { PanelPane } from "./PanelPane";

export function PanelContainer() {
  const { isPanelOpen, panelSize, panelPosition, panelAlignment, setPanelSize, togglePanel } = usePanelStore(
    useShallow((state) => ({
      isPanelOpen: state.isPanelOpen,
      panelSize: state.panelSize,
      panelPosition: state.panelPosition,
      panelAlignment: state.panelAlignment,
      setPanelSize: state.setPanelSize,
      togglePanel: state.togglePanel
    }))
  );

  const { isSidebarOpen, sidebarWidth } = useWorkbenchStore(
    useShallow((state) => ({
      isSidebarOpen: state.isSidebarOpen,
      sidebarWidth: state.sidebarWidth,
    }))
  );

  const panelRef = useRef<HTMLDivElement>(null);

  // Global custom event logic
  useEffect(() => {
    const handleCustomToggle = () => {
      togglePanel();
    };
    window.addEventListener("toggle-bottom-panel", handleCustomToggle);
    return () => {
      window.removeEventListener("toggle-bottom-panel", handleCustomToggle);
    };
  }, [togglePanel]);

  const startPanelResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    
    // Get actual width/height based on orientation
    const isHorizontal = panelPosition === 'left' || panelPosition === 'right';
    const startSize = panelRef.current 
      ? (isHorizontal ? panelRef.current.offsetWidth : panelRef.current.offsetHeight) 
      : panelSize;
      
    let finalSize = startSize;
    let animationFrameId: number;
    
    document.body.style.userSelect = "none";
    document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize";
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      
      animationFrameId = requestAnimationFrame(() => {
        let newSize = startSize;
        
        if (panelPosition === 'bottom') {
          newSize = Math.max(100, Math.min(startSize - (moveEvent.clientY - startY), 800));
        } else if (panelPosition === 'top') {
          newSize = Math.max(100, Math.min(startSize + (moveEvent.clientY - startY), 800));
        } else if (panelPosition === 'right') {
          newSize = Math.max(100, Math.min(startSize - (moveEvent.clientX - startX), 800));
        } else if (panelPosition === 'left') {
          newSize = Math.max(100, Math.min(startSize + (moveEvent.clientX - startX), 800));
        }
        
        finalSize = newSize;
        
        if (panelRef.current) {
          if (isHorizontal) {
            panelRef.current.style.width = `${newSize}px`;
          } else {
            panelRef.current.style.height = `${newSize}px`;
          }
        }
        
        const editorContainer = document.getElementById("workbench-editor-container");
        if (editorContainer) {
          if (panelPosition === 'bottom') editorContainer.style.bottom = `${newSize}px`;
          else if (panelPosition === 'top') editorContainer.style.top = `${newSize}px`;
          else if (panelPosition === 'right') editorContainer.style.right = `${newSize}px`;
          else if (panelPosition === 'left') {
             const sbWidth = useWorkbenchStore.getState().isSidebarOpen ? useWorkbenchStore.getState().sidebarWidth : 0;
             editorContainer.style.left = `${sbWidth + newSize}px`;
          }
        }

        // Push Sidebar bounds if Panel is Justify
        const pStore = usePanelStore.getState();
        if (pStore.panelAlignment === 'justify' && (panelPosition === 'bottom' || panelPosition === 'top')) {
          const sidebarContainer = document.getElementById("workbench-sidebar-container");
          if (sidebarContainer) {
            if (panelPosition === 'bottom') sidebarContainer.style.bottom = `${newSize}px`;
            if (panelPosition === 'top') sidebarContainer.style.top = `${newSize}px`;
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
      
      setPanelSize(finalSize);
    };
    
    document.body.style.pointerEvents = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [panelSize, panelPosition, setPanelSize]);

  if (!isPanelOpen) return null;

  // Determine dynamic classes based on position
  const isHorizontal = panelPosition === 'left' || panelPosition === 'right';
  
  let containerClass = "absolute flex shrink-0 overflow-hidden bg-background z-10";
  let resizerClass = "absolute bg-border hover:bg-primary/50 z-20 transition-colors pointer-events-auto shrink-0";
  let style: React.CSSProperties = { contain: "strict" };

  if (panelPosition === 'bottom') {
    containerClass += " bottom-0 right-0 flex-col";
    resizerClass += " top-0 left-0 right-0 h-[1px] cursor-row-resize hover:h-[4px] hover:-mt-[1.5px]";
    style.height = panelSize;
    style.left = panelAlignment === 'justify' ? 0 : (isSidebarOpen ? sidebarWidth : 0);
  } else if (panelPosition === 'top') {
    containerClass += " top-0 right-0 flex-col";
    resizerClass += " bottom-0 left-0 right-0 h-[1px] cursor-row-resize hover:h-[4px] hover:-mb-[1.5px]";
    style.height = panelSize;
    style.left = panelAlignment === 'justify' ? 0 : (isSidebarOpen ? sidebarWidth : 0);
  } else if (panelPosition === 'right') {
    containerClass += " right-0 top-0 bottom-0 flex-row";
    resizerClass += " left-0 top-0 bottom-0 w-[1px] cursor-col-resize hover:w-[4px] hover:-ml-[1.5px]";
    style.width = panelSize;
  } else if (panelPosition === 'left') {
    containerClass += " top-0 bottom-0 flex-row";
    resizerClass += " right-0 top-0 bottom-0 w-[1px] cursor-col-resize hover:w-[4px] hover:-mr-[1.5px]";
    style.width = panelSize;
    style.left = isSidebarOpen ? sidebarWidth : 0;
  }

  return (
    <div id="workbench-panel-container" ref={panelRef} className={containerClass} style={style}>
      <div className={resizerClass} onMouseDown={startPanelResize} />
      <div className={`w-full h-full flex flex-col overflow-hidden ${panelPosition === 'bottom' ? 'pt-[1px]' : ''} ${panelPosition === 'top' ? 'pb-[1px]' : ''} ${panelPosition === 'right' ? 'pl-[1px]' : ''} ${panelPosition === 'left' ? 'pr-[1px]' : ''}`}>
        <PanelPane />
      </div>
    </div>
  );
}
