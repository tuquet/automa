"use client";

import { useEffect, useState, useCallback } from "react";
import { ActivityBar } from "./ActivityBar";
import { SidebarPane } from "./SidebarPane";
import { TerminalPane } from "./TerminalPane";
import { StatusBar } from "./StatusBar";
import { 
  FolderGit2, X, Play, PanelRight, MoreHorizontal, Maximize, 
  Trash2, Plus, ChevronUp, XCircle, AlertTriangle, Cpu, Globe, RefreshCcw, 
  ChevronRight, FilePlus, FolderPlus, RefreshCw, Edit2, ListTree,
  PanelBottom, PanelLeft, Search, Minus, Square, Layout
} from "lucide-react";
import { ActionItem } from "@/components/ui/action-item";
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { TitleBar } from "./TitleBar";
import { TitleMenu } from "@/components/ui/title-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ErrorBoundary } from "./ErrorBoundary";
import { WindowControls } from "./WindowControls";
import { ModeToggle } from "@/components/mode-toggle";

import { useWorkbenchStore } from "@/stores/workbench";
import { SidebarContainer } from "./SidebarContainer";
import { PanelContainer } from "./PanelContainer";
import { usePanelStore } from "@/stores/panel";
import { useShallow } from "zustand/react/shallow";
import { useCommandStore } from "@/stores/command";
import { CommandPalette } from "@/components/CommandPalette";

function EditorContainer({ children }: { children?: React.ReactNode }) {
  const { isPanelOpen, panelSize, panelPosition, panelAlignment } = usePanelStore(
    useShallow((state) => ({
      isPanelOpen: state.isPanelOpen,
      panelSize: state.panelSize,
      panelPosition: state.panelPosition,
      panelAlignment: state.panelAlignment,
    }))
  );

  const { isSidebarOpen, sidebarWidth, isSecondarySidebarOpen, secondarySidebarWidth } = useWorkbenchStore(
    useShallow((state) => ({
      isSidebarOpen: state.isSidebarOpen,
      sidebarWidth: state.sidebarWidth,
      isSecondarySidebarOpen: state.isSecondarySidebarOpen,
      secondarySidebarWidth: state.secondarySidebarWidth,
    }))
  );

  // Math logic for Absolute Grid
  let top = 0;
  let bottom = 0;
  let left = isSidebarOpen ? sidebarWidth : 0;
  let right = isSecondarySidebarOpen ? secondarySidebarWidth : 0;

  if (isPanelOpen) {
    if (panelPosition === 'bottom') {
      bottom = panelSize;
    } else if (panelPosition === 'top') {
      top = panelSize;
    } else if (panelPosition === 'right') {
      right = (isSecondarySidebarOpen ? secondarySidebarWidth : 0) + panelSize;
    } else if (panelPosition === 'left') {
      left = (isSidebarOpen ? sidebarWidth : 0) + panelSize;
    }
  }

  return (
    <div 
      id="workbench-editor-container" 
      className="absolute overflow-hidden" 
      style={{ top, bottom, left, right }}
    >
      {children}
    </div>
  );
}

function SecondarySidebarContainer() {
  const { isSecondarySidebarOpen, secondarySidebarWidth } = useWorkbenchStore(
    useShallow((state) => ({
      isSecondarySidebarOpen: state.isSecondarySidebarOpen,
      secondarySidebarWidth: state.secondarySidebarWidth,
    }))
  );

  if (!isSecondarySidebarOpen) return null;

  return (
    <div 
      className="absolute right-0 top-0 bottom-0 border-l border-border bg-background flex flex-col"
      style={{ width: secondarySidebarWidth }}
    >
      <div className="h-[35px] border-b border-border flex items-center px-4 font-medium text-xs uppercase tracking-wider text-muted-foreground shrink-0">
        Secondary Side Bar
      </div>
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        No Views
      </div>
    </div>
  );
}

export function WorkbenchLayout({ children }: { children?: React.ReactNode }) {
  const toggleSidebar = useWorkbenchStore((state) => state.toggleSidebar);
  const toggleSecondarySidebar = useWorkbenchStore((state) => state.toggleSecondarySidebar);

  const hasHydrated = useWorkbenchStore((state) => state._hasHydrated);

  return (
    <div id="workbench.main.container" data-testid="workbench.main.container" className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <CommandPalette />
      
      {/* TITLE BAR */}
      <TitleBar 
        appIcon={
          <div className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-primary">A</span>
          </div>
        }
        menus={
          <>
            <TitleMenu label="File">
              <DropdownMenuItem>New File</DropdownMenuItem>
              <DropdownMenuItem>New Window</DropdownMenuItem>
              <DropdownMenuItem>Save</DropdownMenuItem>
            </TitleMenu>
            <TitleMenu label="Edit">
              <DropdownMenuItem>Undo</DropdownMenuItem>
              <DropdownMenuItem>Redo</DropdownMenuItem>
            </TitleMenu>
            <TitleMenu label="View">
              <DropdownMenuItem>Command Palette</DropdownMenuItem>
              <DropdownMenuItem>Appearance</DropdownMenuItem>
            </TitleMenu>
          </>
        }
        centerContent={
          <div 
            onClick={() => useCommandStore.getState().open()}
            className="w-full max-w-[400px] h-6 bg-muted/50 border border-border rounded-md flex items-center px-2 text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer text-xs"
          >
            <Search className="w-3.5 h-3.5 mr-2" />
            <span>Search Automa Workspace (Ctrl+K)</span>
          </div>
        }
        layoutControls={
          <>
            <div className="w-[1px] h-4 bg-border mx-2" />
            <ActionItem visibility="always" icon={<PanelLeft className="w-4 h-4" />} label="Toggle Primary Side Bar" onClick={toggleSidebar} />
            <ActionItem visibility="always" icon={<PanelBottom className="w-4 h-4" />} label="Toggle Panel" onClick={() => window.dispatchEvent(new CustomEvent('toggle-bottom-panel'))} />
            <ActionItem visibility="always" icon={<PanelRight className="w-4 h-4" />} label="Toggle Secondary Side Bar" onClick={toggleSecondarySidebar} />
            <ActionItem visibility="always" icon={<Layout className="w-4 h-4" />} label="Customize Layout" />
            <div className="flex items-center mx-1">
              <ModeToggle />
            </div>
            <WindowControls />
          </>
        }
      />

      {/* MAIN WORKSPACE WRAPPED IN ERROR BOUNDARY */}
      <ErrorBoundary>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          
          {/* ACTIVITY BAR */}
          <ActivityBar />

          {/* MASTER GRID STACK (Absolute Positioning Matrix) */}
          <div className="flex-1 min-w-0 h-full overflow-hidden relative" id="workbench-grid">
            {hasHydrated ? (
              <>
                <SidebarContainer />
                <PanelContainer />
                <EditorContainer>{children}</EditorContainer>
                <SecondarySidebarContainer />
              </>
            ) : null}
          </div>
        </div>
        
        {/* STATUS BAR */}
        <StatusBar 
          leftItems={
            <>
              <div className="flex items-center gap-1 px-1.5 h-full hover:bg-muted/50 hover:text-foreground cursor-pointer transition-colors">
                <Cpu className="w-3.5 h-3.5" />
                <span>Automa Engine: Ready</span>
              </div>
              <div className="flex items-center gap-1 px-1.5 h-full hover:bg-muted/50 hover:text-foreground cursor-pointer transition-colors">
                <XCircle className="w-3 h-3 text-muted-foreground" />
                <span>0</span>
                <AlertTriangle className="w-3 h-3 text-muted-foreground ml-1" />
                <span>0</span>
              </div>
            </>
          }
          rightItems={
            <>
              <div className="flex items-center gap-1 px-1.5 h-full hover:bg-muted/50 hover:text-foreground cursor-pointer transition-colors">
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Sync Active</span>
              </div>
              <div className="flex items-center gap-1 px-1.5 h-full hover:bg-muted/50 hover:text-foreground cursor-pointer transition-colors">
                <Globe className="w-3.5 h-3.5" />
                <span>Default Env</span>
              </div>
              <div className="flex items-center gap-1 px-1.5 h-full hover:bg-muted/50 hover:text-foreground cursor-pointer transition-colors">
                <span>v0.1.0</span>
              </div>
            </>
          }
        />
      </ErrorBoundary>
    </div>
  );
}
