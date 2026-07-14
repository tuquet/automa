"use client";

import React, { useEffect, useRef } from "react";
import { useContextStore } from "@/stores/context";
import { KEYBINDINGS, normalizeKey } from "@/registry/keybindings";

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
  const evaluateContext = useContextStore((state) => state.evaluateContext);
  const setContext = useContextStore((state) => state.setContext);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const pressedKey = normalizeKey(e);
      
      for (const binding of KEYBINDINGS) {
        if (binding.key === pressedKey) {
          if (evaluateContext(binding.when)) {
            e.preventDefault();
            binding.command();
            return; // Stop after first matching command
          }
        }
      }
    };

    // Global focus tracker to update generic contexts automatically
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        setContext('inInput', true);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        setContext('inInput', false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, [evaluateContext, setContext]);

  return <>{children}</>;
}
