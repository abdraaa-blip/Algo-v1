"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { X, Command } from "lucide-react";

interface Shortcut {
  key: string;
  label: string;
  action: () => void;
  modifier?: "meta" | "ctrl" | "alt" | "shift";
}

/**
 * Global Keyboard Shortcuts for Power Users
 * Inspired by Linear, Vercel, and Notion
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: Shortcut[] = useMemo(
    () => [
      {
        key: "h",
        label: "Accueil (NOW)",
        action: () => router.push("/"),
        modifier: "meta",
      },
      {
        key: "t",
        label: "Trends",
        action: () => router.push("/trends"),
        modifier: "meta",
      },
      {
        key: "s",
        label: "Rising Stars",
        action: () => router.push("/rising-stars"),
        modifier: "meta",
      },
      {
        key: "v",
        label: "Videos",
        action: () => router.push("/videos"),
        modifier: "meta",
      },
      {
        key: "n",
        label: "News",
        action: () => router.push("/news"),
        modifier: "meta",
      },
      {
        key: "k",
        label: "Recherche",
        action: () => router.push("/search"),
        modifier: "meta",
      },
      {
        key: "p",
        label: "Profil",
        action: () => router.push("/profile"),
        modifier: "meta",
      },
      { key: "?", label: "Raccourcis", action: () => setShowHelp(true) },
      { key: "Escape", label: "Fermer", action: () => setShowHelp(false) },
    ],
    [router],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const modifierPressed = shortcut.modifier
          ? (shortcut.modifier === "meta" &&
              (event.metaKey || event.ctrlKey)) ||
            (shortcut.modifier === "ctrl" && event.ctrlKey) ||
            (shortcut.modifier === "alt" && event.altKey) ||
            (shortcut.modifier === "shift" && event.shiftKey)
          : true;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          modifierPressed
        ) {
          // Only require modifier for navigation shortcuts
          if (shortcut.modifier && !(event.metaKey || event.ctrlKey)) continue;

          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!showHelp) return null;

  return (
    <div
      className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl max-w-md w-full p-6 space-y-6 shadow-[var(--shadow-algo-md)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Command size={18} className="text-violet-400" />
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              Raccourcis clavier
            </h2>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="p-1.5 rounded-lg hover:bg-[var(--color-card-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-2">
          {shortcuts
            .filter((s) => s.key !== "Escape")
            .map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--color-card)]"
              >
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {shortcut.label}
                </span>
                <kbd
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md",
                    "bg-[var(--color-card)] border border-[var(--color-border)]",
                    "text-xs font-mono text-[var(--color-text-tertiary)]",
                  )}
                >
                  {shortcut.modifier && (
                    <>
                      <span className="text-[10px]">⌘</span>
                      <span>+</span>
                    </>
                  )}
                  <span className="uppercase">{shortcut.key}</span>
                </kbd>
              </div>
            ))}
        </div>

        {/* Footer */}
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          Appuyez sur{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-tertiary)]">
            ?
          </kbd>{" "}
          pour afficher ce menu
        </p>
      </div>
    </div>
  );
}
