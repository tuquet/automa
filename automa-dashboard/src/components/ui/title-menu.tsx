import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TitleMenuProps {
  label: string;
  children: React.ReactNode;
}

export function TitleMenu({ label, children }: TitleMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="px-2 h-[26px] text-[13px] text-muted-foreground hover:bg-muted/80 hover:text-foreground rounded-md outline-none data-[state=open]:bg-muted/80 data-[state=open]:text-foreground transition-colors cursor-default">
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="text-xs min-w-[150px] mt-1 rounded-md">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
