"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(customShortcuts: KeyboardShortcut[] = []) {
  const router = useRouter();

  const builtInShortcuts: KeyboardShortcut[] = useMemo(
    () => [
      { key: "h", description: "Go to Home", action: () => router.push("/") },
      {
        key: "t",
        description: "Go to Trends",
        action: () => router.push("/trends"),
      },
      {
        key: "v",
        description: "Go to Videos",
        action: () => router.push("/videos"),
      },
      {
        key: "n",
        description: "Go to News",
        action: () => router.push("/news"),
      },
      {
        key: "c",
        description: "Go to Creator Mode",
        action: () => router.push("/creator-mode"),
      },
      {
        key: "s",
        description: "Go to Rising Stars",
        action: () => router.push("/rising-stars"),
      },
      {
        key: "/",
        description: "Focus Search",
        action: () => {
          const searchInput = document.querySelector<HTMLInputElement>(
            "[data-search-input]",
          );
          searchInput?.focus();
        },
      },
      {
        key: "Escape",
        description: "Close Modal / Clear",
        action: () => {
          document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape" }),
          );
        },
      },
      {
        key: "?",
        shift: true,
        description: "Show Shortcuts Help",
        action: () => {
          window.dispatchEvent(new CustomEvent("algo:show-shortcuts"));
        },
      },
    ],
    [router],
  );

  const allShortcuts = useMemo(
    () => [...builtInShortcuts, ...customShortcuts],
    [builtInShortcuts, customShortcuts],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Only allow Escape in inputs
        if (event.key !== "Escape") return;
      }

      for (const shortcut of allShortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !(event.ctrlKey || event.metaKey);
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [allShortcuts],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts: allShortcuts };
}

// Component to display keyboard shortcuts
export function KeyboardShortcutsHelp() {
  return null; // Implemented in ShortcutsModal component
}

export default useKeyboardShortcuts;
