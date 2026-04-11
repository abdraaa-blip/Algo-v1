"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  TrendingUp,
  Wand2,
  Bookmark,
  BrainCircuit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

const navConfig = [
  { path: "/", labelKey: "nav.home", Icon: Flame },
  { path: "/trends", labelKey: "nav.trends", Icon: TrendingUp },
  { path: "/creator-mode", labelKey: "nav.create", Icon: Wand2 },
  { path: "/watchlist", labelKey: "nav.favorites", Icon: Bookmark },
  { path: "/ai", labelKey: "nav.algoAi", Icon: BrainCircuit },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[200] max-w-full overflow-x-clip md:hidden algo-bar-mobile"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigation mobile"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {navConfig.map(({ path, labelKey, Icon }) => {
          const isActive =
            path === "/" ? pathname === "/" : pathname.startsWith(path);
          const label = t(labelKey);

          return (
            <Link
              key={path}
              href={path}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "algo-interactive relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl",
                "transition-[color,transform] duration-200 ease-out",
                isActive
                  ? "text-[var(--color-violet)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-tertiary)]",
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
              <span
                className={cn(
                  "text-[9px] font-semibold tracking-wide",
                  isActive
                    ? "text-[var(--color-violet)]"
                    : "text-[var(--color-text-muted)]",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
