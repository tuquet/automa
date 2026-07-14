import * as React from "react"
import { cn } from "@/lib/utils"

export interface TitleBarProps extends React.HTMLAttributes<HTMLDivElement> {
  appIcon?: React.ReactNode;
  menus?: React.ReactNode;
  centerContent?: React.ReactNode;
  layoutControls?: React.ReactNode;
}

export function TitleBar({ appIcon, menus, centerContent, layoutControls, className, ...props }: TitleBarProps) {
  return (
    <div id="workbench.parts.titlebar" data-testid="workbench.parts.titlebar" data-tauri-drag-region className={cn("h-[35px] flex items-center justify-between border-b border-border bg-background px-2 shrink-0 select-none", className)} {...props}>
      {/* Left: App Icon & Menus */}
      <div id="workbench.parts.titlebar.left" data-testid="workbench.parts.titlebar.left" data-tauri-drag-region className="flex items-center h-full flex-1 min-w-0">
        {appIcon && (
          <div className="flex items-center justify-center shrink-0 mr-2 pointer-events-auto">
            {appIcon}
          </div>
        )}
        
        {menus && (
          <div className="flex items-center h-full space-x-0.5 pointer-events-auto min-w-0 overflow-hidden">
            {menus}
          </div>
        )}
      </div>

      {/* Center: Search / Title */}
      <div id="workbench.parts.titlebar.center" data-testid="workbench.parts.titlebar.center" data-tauri-drag-region className="flex justify-center flex-1 max-w-[600px] px-4">
         <div className="pointer-events-auto w-full flex justify-center">
           {centerContent}
         </div>
      </div>

      {/* Right: Layout Controls */}
      <div id="workbench.parts.titlebar.right" data-testid="workbench.parts.titlebar.right" data-tauri-drag-region className="flex items-center justify-end flex-1 min-w-0">
        <div className="pointer-events-auto flex items-center h-full">
          {layoutControls}
        </div>
      </div>
    </div>
  )
}
