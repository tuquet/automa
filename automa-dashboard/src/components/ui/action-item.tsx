import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

export interface ActionItemProps extends React.ComponentPropsWithoutRef<typeof Button> {
  icon: React.ReactNode
  label: string
  shortcut?: string
  visibility?: "always" | "hover-group" | "hover-item"
}

export const ActionItem = React.forwardRef<HTMLButtonElement, ActionItemProps>(
  ({ icon, label, shortcut, visibility = "always", className, ...props }, ref) => {
    
    // In VS Code, action buttons are usually small (20x20 or 22x22) with a 14-16px icon
    const visibilityClass = 
      visibility === "hover-group" 
        ? "opacity-0 group-hover/collapsible:opacity-100 focus:opacity-100" 
        : visibility === "hover-item"
        ? "opacity-0 group-hover/menu-item:opacity-100 focus:opacity-100"
        : ""

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              ref={ref}
              variant="ghost"
              size="icon"
              className={cn(
                "h-[22px] w-[22px] rounded-md transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted/80 shrink-0",
                visibilityClass,
                className
              )}
              {...props}
            >
              {icon}
              <span className="sr-only">{label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center" className="text-xs">
            {label} {shortcut && <span className="ml-1 text-muted-foreground opacity-70">({shortcut})</span>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
)
ActionItem.displayName = "ActionItem"
