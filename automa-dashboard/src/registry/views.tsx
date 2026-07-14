import React from "react";
import { FolderGit2, Settings as SettingsIcon } from "lucide-react";

// Placeholder widget for testing the View Registry
const WelcomeWidget = () => {
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted border border-border/50 mb-4">
          <FolderGit2 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Welcome to Automa Ecosystem</h3>
        <p className="text-sm text-muted-foreground mt-2">Open a file from the Explorer to begin editing.</p>
      </div>
    </div>
  );
};

const SettingsWidget = () => {
  return (
    <div className="flex flex-col h-full w-full bg-background overflow-y-auto">
      <div className="flex items-center px-6 py-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <SettingsIcon className="w-5 h-5 mr-3 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Settings</h2>
      </div>
      <div className="p-6 max-w-3xl">
        <p className="text-sm text-muted-foreground mb-6">Commonly Used</p>
        <div className="space-y-6">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Editor: Font Size</label>
            <p className="text-xs text-muted-foreground">Controls the font size in pixels.</p>
            <input type="number" defaultValue={14} className="flex h-9 w-full md:w-[300px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Editor: Word Wrap</label>
            <p className="text-xs text-muted-foreground">Controls how lines should wrap.</p>
            <select className="flex h-9 w-full md:w-[300px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
              <option value="off">off</option>
              <option value="on">on</option>
              <option value="wordWrapColumn">wordWrapColumn</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fallback widget for unregistered viewTypes
const NotFoundWidget = ({ viewType }: { viewType: string }) => {
  return (
    <div className="flex h-full w-full items-center justify-center p-4 text-destructive">
      No renderer found for viewType: {viewType}
    </div>
  );
};

export const ViewRegistry: Record<string, React.FC<any>> = {
  'welcome': WelcomeWidget,
  'settings': SettingsWidget,
  // Later we can register: 'code_editor', 'automa_manager', etc.
};

export const resolveViewWidget = (viewType: string): React.FC<any> => {
  return ViewRegistry[viewType] || NotFoundWidget;
};
