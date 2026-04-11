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
      <div className="flex items-stretch justify-around min-h-14 px-1.5 gap-0.5">
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
                "algo-interactive relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5",
                "min-h-12 min-w-0 max-w-[5.5rem] transition-[color,background-color,opacity] duration-200 ease-out",
                "active:opacity-90",
                isActive
                  ? "text-[var(--color-violet)] bg-[color-mix(in_srgb,var(--color-violet)_14%,transparent)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[color-mix(in_srgb,var(--color-text-primary)_6%,transparent)]",
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.65} aria-hidden />
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-wide leading-tight text-center line-clamp-2",
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
