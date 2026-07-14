import { ExplorerMenu } from "@/components/layout/sidebar/ExplorerMenu";
import { SearchMenu } from "@/components/layout/sidebar/SearchMenu";
import { WorkflowsMenu } from "@/components/layout/sidebar/WorkflowsMenu";
import { SidebarPane } from "@/components/layout/SidebarPane";
import { ActivityId } from "@/stores/workbench";
import React from "react";

// Fallback for not-yet-implemented sidebars
const PlaceholderSidebar = ({ title }: { title: string }) => (
  <SidebarPane headerTitle={title}>
    <div className="p-4 flex flex-col items-center justify-center text-center h-full text-muted-foreground">
      <p className="text-sm">Coming soon</p>
    </div>
  </SidebarPane>
);

export const SidebarRegistry: Record<ActivityId, React.FC<any>> = {
  explorer: ExplorerMenu,
  search: SearchMenu,
  workflows: WorkflowsMenu,
  run: () => <PlaceholderSidebar title="Run and Debug" />,
  extensions: () => <PlaceholderSidebar title="Extensions" />,
  settings: () => <PlaceholderSidebar title="Settings" />
};
