"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useHaptic } from "@/hooks/useHaptic";

interface ThemeToggleProps {
  variant?: "icon" | "pills" | "dropdown";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme, mounted } = useTheme();
  const { trigger } = useHaptic();

  if (!mounted) {
    return (
      <div
        className={cn("size-9 rounded-xl bg-white/5 animate-pulse", className)}
      />
    );
  }

  if (variant === "icon") {
    return (
      <button
        onClick={() => {
          trigger("light");
          toggleTheme();
        }}
        aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        className={cn(
          "size-9 rounded-xl flex items-center justify-center",
          "text-white/40 hover:text-white/70 hover:bg-white/5",
          "transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60",
          className,
        )}
      >
        <div className="relative size-5">
          <Sun
            size={20}
            className={cn(
              "absolute inset-0 transition-all duration-300",
              resolvedTheme === "dark"
                ? "rotate-90 scale-0 opacity-0"
                : "rotate-0 scale-100 opacity-100",
            )}
          />
          <Moon
            size={20}
            className={cn(
              "absolute inset-0 transition-all duration-300",
              resolvedTheme === "dark"
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-0 opacity-0",
            )}
          />
        </div>
      </button>
    );
  }

  if (variant === "pills") {
    const options = [
      { value: "light" as const, icon: Sun, label: "Light" },
      { value: "dark" as const, icon: Moon, label: "Dark" },
      { value: "system" as const, icon: Monitor, label: "System" },
    ];

    return (
      <div className={cn("inline-flex p-1 rounded-xl bg-white/5", className)}>
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              trigger("light");
              setTheme(option.value);
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              theme === option.value
                ? "bg-violet-500/20 text-violet-400"
                : "text-white/40 hover:text-white/60",
            )}
            aria-pressed={theme === option.value}
          >
            <option.icon size={14} />
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return null;
}
