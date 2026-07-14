import { SidebarPane } from "../SidebarPane";
import { FolderGit2 } from "lucide-react";

export function WorkflowsMenu() {
  return (
    <SidebarPane headerTitle="Workflows">
      <div className="p-4 flex flex-col items-center justify-center text-center h-full text-muted-foreground">
        <FolderGit2 className="w-10 h-10 mb-2 opacity-20" />
        <p className="text-sm">Workflows list coming soon</p>
      </div>
    </SidebarPane>
  );
}
