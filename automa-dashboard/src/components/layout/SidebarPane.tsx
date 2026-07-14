import * as React from "react"
import { cn } from "@/lib/utils"
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";

export interface SidebarPaneProps extends React.ComponentPropsWithoutRef<typeof Sidebar> {
  headerTitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  children?: React.ReactNode;
}

export function SidebarPane({ headerTitle, headerActions, children, className, ...props }: SidebarPaneProps) {
  return (
    <Sidebar id="workbench.parts.sidebar" data-testid="workbench.parts.sidebar" collapsible="none" className={cn("h-full w-full !border-r-0", className)} {...props}>
      
      {/* Sidebar Header */}
      {(headerTitle || headerActions) && (
        <SidebarHeader id="workbench.parts.sidebar.header" data-testid="workbench.parts.sidebar.header" className="h-[35px] flex flex-row items-center justify-between px-4 py-0 shrink-0 group/header">
          <span className="text-[11px] font-normal text-muted-foreground uppercase tracking-wider">
            {headerTitle}
          </span>
          <div id="workbench.parts.sidebar.actions" data-testid="workbench.parts.sidebar.actions" className="flex items-center gap-0">
            {headerActions}
          </div>
        </SidebarHeader>
      )}

      <SidebarContent id="workbench.parts.sidebar.content" data-testid="workbench.parts.sidebar.content" className="no-scrollbar pt-0">
        {children}
      </SidebarContent>
    </Sidebar>
  );
}
