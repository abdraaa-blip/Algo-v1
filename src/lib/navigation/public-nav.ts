/**
 * Navigation publique · hiérarchie produit (SaaS lisible, marché large).
 * Libellés via clés `nav.*` dans `src/i18n/locales/*.json` + `useTranslation`.
 */
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BrainCircuit,
  Film,
  Flame,
  Info,
  LayoutDashboard,
  Music,
  Newspaper,
  Play,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export type PublicNavItem = {
  readonly href: string;
  /** Clé plate pour `useTranslation` (ex. nav.home) */
  readonly labelKey: string;
  readonly icon: LucideIcon;
};

/** Liens toujours visibles dans la barre (ordre = parcours valeur). */
export const NAV_PRIMARY: readonly PublicNavItem[] = [
  { href: "/", labelKey: "nav.home", icon: Flame },
  { href: "/trends", labelKey: "nav.trends", icon: TrendingUp },
  { href: "/creator-mode", labelKey: "nav.create", icon: Sparkles },
  { href: "/ai", labelKey: "nav.algoAi", icon: BrainCircuit },
] as const;

/** Rubriques accessibles via « Plus » (découverte médias, pro, à propos). */
export const NAV_MORE: readonly PublicNavItem[] = [
  { href: "/videos", labelKey: "nav.videos", icon: Play },
  { href: "/news", labelKey: "nav.news", icon: Newspaper },
  { href: "/movies", labelKey: "nav.movies", icon: Film },
  { href: "/music", labelKey: "nav.music", icon: Music },
  { href: "/intelligence", labelKey: "nav.intelligence", icon: Activity },
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/about", labelKey: "nav.about", icon: Info },
] as const;

export function isNavMoreActive(pathname: string): boolean {
  return NAV_MORE.some((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );
}
