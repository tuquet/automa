"use client";

import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useTheme } from "next-themes";
import "@xterm/xterm/css/xterm.css";

export interface XTermWrapperProps {
  terminalId: string;
  profile: string;
}

export default function XTermWrapper({ terminalId, profile }: XTermWrapperProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "'MesloLGS NF', 'CaskaydiaCove Nerd Font', Consolas, 'Courier New', monospace",
      fontSize: 13,
      theme: {
        background: resolvedTheme === "dark" ? "#09090b" : "#ffffff", 
        foreground: resolvedTheme === "dark" ? "#fafafa" : "#09090b", 
        cursor: resolvedTheme === "dark" ? "#fafafa" : "#09090b",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    
    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__;
    
    let onDataDisposable: any = null;
    let unlistenFn: any = null;
    let resizeObserver: ResizeObserver | null = null;

    const setupTerminal = async () => {
      if (!isTauri) {
        term.write("\r\n\x1b[33mWarning: PTY Backend is only available in the Tauri Desktop App.\x1b[0m\r\n");
        term.write("\x1b[33mPlease run 'pnpm tauri dev' to experience the real terminal.\x1b[0m\r\n\r\n");
        
        onDataDisposable = term.onData((data) => {
           term.write(data);
        });
        
        fitAddon.fit();
        return;
      }

      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const { listen } = await import("@tauri-apps/api/event");

        setTimeout(() => {
          fitAddon.fit();
          if (term.cols && term.rows) {
            invoke("spawn_pty", { id: terminalId, cols: term.cols, rows: term.rows, profile }).catch(console.error);
          }
        }, 100);

        onDataDisposable = term.onData((data) => {
          invoke("write_pty", { id: terminalId, data }).catch(console.error);
        });

        unlistenFn = await listen<number[]>(`pty-data-${terminalId}`, (event) => {
          const bytes = new Uint8Array(event.payload);
          term.write(bytes);
        });

        resizeObserver = new ResizeObserver(() => {
          if (fitAddonRef.current && termRef.current) {
            try {
              fitAddonRef.current.fit();
              const cols = termRef.current.cols;
              const rows = termRef.current.rows;
              if (cols && rows) {
                invoke("resize_pty", { id: terminalId, cols, rows }).catch(console.error);
              }
            } catch(e) {}
          }
        });
        
        resizeObserver.observe(terminalRef.current!);
      } catch (e: any) {
        term.write(`\r\n\x1b[31m[Tauri API Error]: ${e?.message || e}\x1b[0m\r\n`);
        term.write("\x1b[33mFalling back to Local Echo Mode.\x1b[0m\r\n\r\n");
        onDataDisposable = term.onData((data) => {
           term.write(data);
        });
      }
    };

    setupTerminal();

    return () => {
      if (onDataDisposable) onDataDisposable.dispose();
      if (resizeObserver) resizeObserver.disconnect();
      if (unlistenFn) unlistenFn();
      term.dispose();
      // Inform backend to kill this pty
      if (isTauri) {
        import("@tauri-apps/api/core").then(({ invoke }) => {
          invoke("kill_pty", { id: terminalId }).catch(console.error);
        });
      }
    };
  }, [terminalId, profile]);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.theme = {
        background: resolvedTheme === "dark" ? "#09090b" : "#ffffff",
        foreground: resolvedTheme === "dark" ? "#fafafa" : "#09090b",
        cursor: resolvedTheme === "dark" ? "#fafafa" : "#09090b",
      };
    }
  }, [resolvedTheme]);

  return <div ref={terminalRef} className="w-full h-full overflow-hidden" />;
}
