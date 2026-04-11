"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import { ScopeSelector } from "./ScopeSelector";
import { AlgoHeartbeat } from "@/components/algo/AlgoHeartbeat";
import { useScopeContext } from "@/contexts/ScopeContext";
import {
  getDateLocaleForCountry,
  getScopeCountryCode,
  getTimeZoneForCountry,
} from "@/lib/geo/country-profile";
import {
  NAV_MORE,
  NAV_PRIMARY,
  isNavMoreActive,
} from "@/lib/navigation/public-nav";
import {
  Search,
  Bell,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { scope, setScope } = useScopeContext();
  const scrollRef = useRef<HTMLElement>(null);
  const moreWrapRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const activeItem = scrollRef.current.querySelector(
        '[aria-current="page"]',
      );
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [pathname]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = moreWrapRef.current;
      if (el && !el.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  const scrollNav = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -150 : 150,
        behavior: "smooth",
      });
    }
  };

  const scopeCountryCode = getScopeCountryCode(scope);
  const scopeTimeZone = getTimeZoneForCountry(scopeCountryCode);
  const scopeDateLocale = getDateLocaleForCountry(scopeCountryCode);
  const localTime = new Intl.DateTimeFormat(scopeDateLocale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: scopeTimeZone,
  }).format(nowTs);

  const moreActive = isNavMoreActive(pathname);

  return (
    <header className="fixed top-0 inset-x-0 z-[200] max-w-full overflow-x-clip pt-[env(safe-area-inset-top,0px)]">
      <div className="algo-nav-chrome">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 h-14 flex items-center gap-2 sm:gap-4">
          <Link href="/" className="flex items-center group shrink-0">
            <AlgoHeartbeat />
          </Link>

          <div className="flex flex-1 min-w-0 items-center gap-1">
            <div className="relative flex flex-1 min-w-0 items-center">
              <button
                type="button"
                onClick={() => scrollNav("left")}
                className={cn(
                  "absolute left-0 z-10 w-8 h-10 flex items-center justify-start pl-1",
                  "bg-gradient-to-r from-[var(--color-bg-primary)] via-[color-mix(in_srgb,var(--color-bg-primary)_88%,transparent)] to-transparent",
                  "text-white/60 hover:text-white transition-opacity duration-200",
                  "md:hidden",
                  canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none",
                )}
                aria-label="Défiler la navigation vers la gauche"
              >
                <ChevronLeft size={18} />
              </button>

              <nav
                ref={scrollRef}
                onScroll={checkScroll}
                className={cn(
                  "flex flex-1 min-w-0 items-center gap-1 overflow-x-auto scroll-smooth",
                  "px-1 sm:px-2 md:justify-center",
                  "scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]",
                  "[&::-webkit-scrollbar]:hidden",
                )}
                aria-label="Navigation principale"
              >
                {NAV_PRIMARY.map(({ href, label, icon: Icon }) => {
                  const isActive =
                    href === "/" ? pathname === "/" : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "algo-interactive flex items-center gap-1.5 px-3 py-2 rounded-lg",
                        "text-xs font-medium whitespace-nowrap",
                        "transition-[color,background-color,box-shadow] duration-200 ease-out",
                        "min-h-[40px] min-w-[44px] shrink-0",
                        isActive
                          ? "text-white bg-[var(--color-violet-muted)] shadow-[0_0_16px_color-mix(in_srgb,var(--color-violet)_22%,transparent)]"
                          : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[color-mix(in_srgb,var(--color-text-primary)_8%,transparent)] active:bg-[color-mix(in_srgb,var(--color-text-primary)_11%,transparent)]",
                      )}
                    >
                      <Icon
                        size={16}
                        strokeWidth={isActive ? 2 : 1.5}
                        aria-hidden="true"
                      />
                      <span className="text-[11px] sm:text-xs">{label}</span>
                    </Link>
                  );
                })}
              </nav>

              <button
                type="button"
                onClick={() => scrollNav("right")}
                className={cn(
                  "absolute right-0 z-10 w-8 h-10 flex items-center justify-end pr-1",
                  "bg-gradient-to-l from-[var(--color-bg-primary)] via-[color-mix(in_srgb,var(--color-bg-primary)_88%,transparent)] to-transparent",
                  "text-white/60 hover:text-white transition-opacity duration-200",
                  "md:hidden",
                  canScrollRight
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none",
                )}
                aria-label="Défiler la navigation vers la droite"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="relative shrink-0" ref={moreWrapRef}>
              <button
                type="button"
                aria-expanded={moreOpen}
                aria-haspopup="true"
                aria-controls="nav-more-panel"
                id="nav-more-trigger"
                onClick={() => setMoreOpen((o) => !o)}
                className={cn(
                  "algo-interactive flex items-center gap-1 px-3 py-2 rounded-lg",
                  "text-xs font-medium whitespace-nowrap",
                  "min-h-[40px] min-w-[44px] shrink-0 border border-transparent",
                  moreOpen || moreActive
                    ? "text-white bg-[color-mix(in_srgb,var(--color-text-primary)_10%,transparent)] border-[var(--color-border)]"
                    : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[color-mix(in_srgb,var(--color-text-primary)_8%,transparent)]",
                )}
              >
                <span className="text-[11px] sm:text-xs">Plus</span>
                <ChevronDown
                  size={14}
                  className={cn(
                    "opacity-70 transition-transform duration-200",
                    moreOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>

              {moreOpen ? (
                <div
                  id="nav-more-panel"
                  role="menu"
                  aria-labelledby="nav-more-trigger"
                  className={cn(
                    "absolute z-[300] mt-1 min-w-[12.5rem] max-w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-secondary)_96%,transparent)] py-1.5 shadow-[var(--shadow-algo-md)] backdrop-blur-xl",
                    "right-0",
                  )}
                >
                  <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                    Rubriques
                  </p>
                  <ul className="max-h-[min(70vh,22rem)] overflow-y-auto">
                    {NAV_MORE.map(({ href, label, icon: Icon }) => {
                      const isActive =
                        href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(href);
                      return (
                        <li key={href} role="none">
                          <Link
                            role="menuitem"
                            href={href}
                            aria-current={isActive ? "page" : undefined}
                            onClick={() => setMoreOpen(false)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2.5 text-xs font-medium",
                              isActive
                                ? "bg-[var(--color-violet-muted)] text-white"
                                : "text-[var(--color-text-secondary)] hover:bg-[color-mix(in_srgb,var(--color-text-primary)_8%,transparent)] hover:text-[var(--color-text-primary)]",
                            )}
                          >
                            <Icon size={16} aria-hidden />
                            {label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <div className="hidden lg:flex items-center rounded-lg border border-[var(--color-border)] px-2 py-1 text-[10px] font-semibold tracking-wide text-[var(--color-text-tertiary)]">
              {scope.type === "global"
                ? `UTC ${localTime}`
                : `${scope.code} ${localTime}`}
            </div>
            <div className="hidden sm:block">
              <ScopeSelector scope={scope} onScopeChange={setScope} />
            </div>

            <Link
              href="/search"
              aria-label="Rechercher"
              className="algo-interactive w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[color-mix(in_srgb,var(--color-text-primary)_8%,transparent)] transition-[color,background-color,transform] duration-200 active:bg-[color-mix(in_srgb,var(--color-text-primary)_11%,transparent)]"
            >
              <Search size={18} strokeWidth={1.5} aria-hidden="true" />
            </Link>

            <Link
              href="/watchlist"
              aria-label="Watchlist - notifications"
              className="algo-interactive w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[color-mix(in_srgb,var(--color-text-primary)_8%,transparent)] transition-[color,background-color,transform] duration-200 relative active:bg-[color-mix(in_srgb,var(--color-text-primary)_11%,transparent)]"
            >
              <Bell size={18} strokeWidth={1.5} aria-hidden="true" />
              <span
                className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-[var(--color-red-alert)] rounded-full"
                aria-label="Nouvelles notifications"
              />
            </Link>

            <Link
              href="/login"
              aria-label="Se connecter"
              className="algo-interactive w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[color-mix(in_srgb,var(--color-text-primary)_8%,transparent)] transition-[color,background-color,transform] duration-200 active:bg-[color-mix(in_srgb,var(--color-text-primary)_11%,transparent)]"
            >
              <User size={18} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="sm:hidden px-3 py-1.5 flex items-center justify-between border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg-primary)_92%,transparent)] backdrop-blur-xl">
        <span className="text-[10px] text-white/30 font-medium">Zone</span>
        <ScopeSelector scope={scope} onScopeChange={setScope} />
      </div>
    </header>
  );
}
