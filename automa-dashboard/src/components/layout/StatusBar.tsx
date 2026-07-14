import * as React from "react"
import { cn } from "@/lib/utils"

export interface StatusBarProps extends React.HTMLAttributes<HTMLDivElement> {
  leftItems?: React.ReactNode;
  rightItems?: React.ReactNode;
}

export function StatusBar({ leftItems, rightItems, className, ...props }: StatusBarProps) {
  return (
    <div id="workbench.parts.statusbar" data-testid="workbench.parts.statusbar" className={cn("w-full h-[22px] shrink-0 border-t border-border bg-sidebar flex items-center justify-between px-2 text-[11px] text-muted-foreground font-medium z-50", className)} {...props}>
       <div className="flex items-center gap-1 h-full">
         {leftItems}
       </div>
       <div className="flex items-center gap-1 h-full">
         {rightItems}
       </div>
    </div>
  );
}
