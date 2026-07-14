"use client";

import { Minus, Square, X } from "lucide-react";
import { useEffect, useState } from "react";

export function WindowControls() {
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    // Check if running inside Tauri
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      setIsTauri(true);
    }
  }, []);

  const handleMinimize = async () => {
    if (!isTauri) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMaximize = async () => {
    if (!isTauri) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = async () => {
    if (!isTauri) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex items-center h-[35px] -mr-2">
      <div 
        onClick={handleMinimize}
        className="w-11 h-full flex items-center justify-center hover:bg-muted/50 cursor-pointer transition-colors text-muted-foreground hover:text-foreground"
      >
        <Minus className="w-3.5 h-3.5" />
      </div>
      <div 
        onClick={handleMaximize}
        className="w-11 h-full flex items-center justify-center hover:bg-muted/50 cursor-pointer transition-colors text-muted-foreground hover:text-foreground"
      >
        <Square className="w-3 h-3" />
      </div>
      <div 
        onClick={handleClose}
        className="w-11 h-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground cursor-pointer transition-colors text-muted-foreground"
      >
        <X className="w-4 h-4" />
      </div>
    </div>
  );
}
