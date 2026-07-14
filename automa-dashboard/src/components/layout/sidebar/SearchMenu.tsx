import { SidebarPane } from "../SidebarPane";
import { Search } from "lucide-react";

export function SearchMenu() {
  return (
    <SidebarPane headerTitle="Search">
      <div className="p-4 flex flex-col items-center justify-center text-center h-full text-muted-foreground">
        <Search className="w-10 h-10 mb-2 opacity-20" />
        <p className="text-sm">Search functionality coming soon</p>
      </div>
    </SidebarPane>
  );
}
