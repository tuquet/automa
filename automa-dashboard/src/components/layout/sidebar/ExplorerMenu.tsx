import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronRight, FilePlus, FolderPlus, RefreshCw, ListTree, FolderGit2, Edit2, Trash2 } from "lucide-react";
import { ActionItem } from "@/components/ui/action-item";
import { SidebarPane } from "../SidebarPane";
import { MoreHorizontal } from "lucide-react";

import { useEditorStore } from "@/stores/editor";

export function ExplorerMenu() {
  const { openTab } = useEditorStore();

  return (
    <SidebarPane
      headerTitle="Explorer"
      headerActions={
        <ActionItem visibility="always" icon={<MoreHorizontal className="w-4 h-4" />} label="Views and More Actions" className="h-6 w-6" />
      }
    >
      <Collapsible defaultOpen className="group/collapsible">
        <SidebarGroup className="p-0 relative">
          <SidebarGroupLabel asChild className="h-[22px] !h-[22px] px-1 py-0 rounded-none hover:bg-muted/50 border-t border-transparent text-[11px] font-bold text-muted-foreground uppercase group-data-[state=open]/collapsible:text-foreground/90">
            <div className="flex items-center justify-between w-full">
              <CollapsibleTrigger className="flex items-center gap-1 overflow-hidden flex-1 cursor-pointer h-full">
                <ChevronRight className="w-3.5 h-3.5 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                <span className="truncate">Automa-Ecosystem (Workspace)</span>
              </CollapsibleTrigger>
              <div className="flex items-center gap-0 pr-1">
                <ActionItem visibility="hover-group" icon={<FilePlus className="w-3.5 h-3.5" />} label="New File" />
                <ActionItem visibility="hover-group" icon={<FolderPlus className="w-3.5 h-3.5" />} label="New Folder" />
                <ActionItem visibility="hover-group" icon={<RefreshCw className="w-3.5 h-3.5" />} label="Refresh Explorer" />
                <ActionItem visibility="hover-group" icon={<ListTree className="w-3.5 h-3.5" />} label="Collapse All" />
              </div>
            </div>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent className="pb-2">
              <SidebarMenu className="gap-0">
                <SidebarMenuItem className="group/menu-item relative">
                  <SidebarMenuButton 
                    className="h-[22px] rounded-none px-6 hover:bg-muted/50 focus-visible:ring-0 data-[active=true]:bg-muted text-sm pr-14"
                    onClick={() => {
                      openTab({
                        id: 'welcome',
                        title: 'Welcome',
                        viewType: 'welcome'
                      })
                    }}
                  >
                    <FolderGit2 className="w-4 h-4 shrink-0 text-primary" />
                    <span className="truncate text-foreground/80">Welcome Page</span>
                  </SidebarMenuButton>
                  <div className="absolute right-1 top-0 bottom-0 flex items-center gap-0">
                    <ActionItem visibility="hover-item" icon={<Edit2 className="w-3.5 h-3.5" />} label="Rename" />
                    <ActionItem visibility="hover-item" icon={<Trash2 className="w-3.5 h-3.5" />} label="Delete" />
                  </div>
                </SidebarMenuItem>
                
                <SidebarMenuItem className="group/menu-item relative">
                  <SidebarMenuButton 
                    className="h-[22px] rounded-none px-6 hover:bg-muted/50 focus-visible:ring-0 data-[active=true]:bg-muted text-sm pr-14"
                    onClick={() => {
                      openTab({
                        id: 'file:/project/main.js',
                        title: 'main.js',
                        viewType: 'code_editor'
                      })
                    }}
                  >
                    <FilePlus className="w-4 h-4 shrink-0 text-yellow-500" />
                    <span className="truncate text-foreground/80">main.js</span>
                  </SidebarMenuButton>
                  <div className="absolute right-1 top-0 bottom-0 flex items-center gap-0">
                    <ActionItem visibility="hover-item" icon={<Edit2 className="w-3.5 h-3.5" />} label="Rename" />
                    <ActionItem visibility="hover-item" icon={<Trash2 className="w-3.5 h-3.5" />} label="Delete" />
                  </div>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    </SidebarPane>
  );
}
