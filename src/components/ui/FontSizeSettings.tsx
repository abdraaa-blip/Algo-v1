"use client";

import { useState, useEffect } from "react";
import { Type, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type FontSize = "small" | "medium" | "large" | "xl";

const FONT_SIZES: { value: FontSize; label: string; size: string }[] = [
  { value: "small", label: "S", size: "14px" },
  { value: "medium", label: "M", size: "16px" },
  { value: "large", label: "L", size: "18px" },
  { value: "xl", label: "XL", size: "20px" },
];

export function FontSizeSettings({ className }: { className?: string }) {
  const [fontSize, setFontSize] = useState<FontSize>("medium");

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem("algo-font-size") as FontSize | null;
    if (saved && FONT_SIZES.some((f) => f.value === saved)) {
      setFontSize(saved);
      document.documentElement.dataset.fontSize = saved;
    }
  }, []);

  const handleChange = (newSize: FontSize) => {
    setFontSize(newSize);
    localStorage.setItem("algo-font-size", newSize);
    document.documentElement.dataset.fontSize = newSize;
  };

  const currentIndex = FONT_SIZES.findIndex((f) => f.value === fontSize);

  const decrease = () => {
    if (currentIndex > 0) {
      handleChange(FONT_SIZES[currentIndex - 1].value);
    }
  };

  const increase = () => {
    if (currentIndex < FONT_SIZES.length - 1) {
      handleChange(FONT_SIZES[currentIndex + 1].value);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Type size={16} className="text-white/40" />

      <button
        onClick={decrease}
        disabled={currentIndex === 0}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          currentIndex === 0
            ? "text-white/20 cursor-not-allowed"
            : "text-white/50 hover:text-white hover:bg-white/5",
        )}
        aria-label="Diminuer la taille du texte"
      >
        <Minus size={14} />
      </button>

      <div className="flex items-center gap-0.5">
        {FONT_SIZES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleChange(value)}
            className={cn(
              "px-2 py-1 rounded text-xs font-medium transition-all",
              fontSize === value
                ? "bg-violet-500/20 text-violet-400"
                : "text-white/40 hover:text-white/60",
            )}
            aria-label={`Taille ${label}`}
            aria-pressed={fontSize === value}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={increase}
        disabled={currentIndex === FONT_SIZES.length - 1}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          currentIndex === FONT_SIZES.length - 1
            ? "text-white/20 cursor-not-allowed"
            : "text-white/50 hover:text-white hover:bg-white/5",
        )}
        aria-label="Augmenter la taille du texte"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// Compact version for settings dropdown
export function FontSizeSettingsCompact({ className }: { className?: string }) {
  const [fontSize, setFontSize] = useState<FontSize>("medium");

  useEffect(() => {
    const saved = localStorage.getItem("algo-font-size") as FontSize | null;
    if (saved) {
      setFontSize(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize;
  }, [fontSize]);

  const handleChange = (newSize: FontSize) => {
    setFontSize(newSize);
    localStorage.setItem("algo-font-size", newSize);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs font-medium text-white/50">
        Taille du texte
      </label>
      <div className="grid grid-cols-4 gap-1">
        {FONT_SIZES.map(({ value, label, size }) => (
          <button
            key={value}
            onClick={() => handleChange(value)}
            className={cn(
              "py-2 rounded-lg text-center transition-all",
              fontSize === value
                ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10",
            )}
          >
            <span className="text-sm font-medium">{label}</span>
            <span className="block text-[10px] text-white/30 mt-0.5">
              {size}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default FontSizeSettings;
