"use client";

import { useEffect } from "react";
import { useCommandStore } from "@/stores/command";
import { useWorkbenchStore } from "@/stores/workbench";
import { usePanelStore } from "@/stores/panel";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { 
  Laptop, 
  Moon, 
  Sun, 
  Settings, 
  PanelLeft, 
  PanelBottom, 
  PanelRight,
  FolderGit2
} from "lucide-react";
import { toast } from "sonner";

export function CommandPalette() {
  const isOpen = useCommandStore((state) => state.isOpen);
  const toggle = useCommandStore((state) => state.toggle);
  const close = useCommandStore((state) => state.close);

  const toggleSidebar = useWorkbenchStore((state) => state.toggleSidebar);
  const toggleSecondarySidebar = useWorkbenchStore((state) => state.toggleSecondarySidebar);
  
  const togglePanel = usePanelStore((state) => state.togglePanel);
  const { setTheme } = useTheme();
  const router = useRouter();

  // Listen for Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggle]);

  const runCommand = (command: () => void) => {
    close();
    command();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => useCommandStore.setState({ isOpen: open })}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => toast("Coming soon: Workflows Page"))}>
              <FolderGit2 className="mr-2 h-4 w-4" />
              <span>Go to Workflows</span>
              <CommandShortcut>G W</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => toast("Coming soon: Settings Page"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <CommandShortcut>G S</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />
          
          <CommandGroup heading="Layout">
            <CommandItem onSelect={() => runCommand(() => toggleSidebar())}>
              <PanelLeft className="mr-2 h-4 w-4" />
              <span>Toggle Primary Side Bar</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => window.dispatchEvent(new CustomEvent('toggle-bottom-panel')))}>
              <PanelBottom className="mr-2 h-4 w-4" />
              <span>Toggle Bottom Panel</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => toggleSecondarySidebar())}>
              <PanelRight className="mr-2 h-4 w-4" />
              <span>Toggle Secondary Side Bar</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />
          
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light Mode</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark Mode</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
              <Laptop className="mr-2 h-4 w-4" />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
          
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
