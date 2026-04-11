/**
 * Navigation publique · hiérarchie produit (SaaS lisible, marché large).
 * Barre = parcours principal ; « Plus » = médias, espace pro et infos sans surcharger la première lecture.
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
  readonly label: string;
  readonly icon: LucideIcon;
};

/** Liens toujours visibles dans la barre (ordre = parcours valeur). */
export const NAV_PRIMARY: readonly PublicNavItem[] = [
  { href: "/", label: "Accueil", icon: Flame },
  { href: "/trends", label: "Tendances", icon: TrendingUp },
  { href: "/creator-mode", label: "Créer", icon: Sparkles },
  { href: "/ai", label: "ALGO AI", icon: BrainCircuit },
] as const;

/** Rubriques accessibles via « Plus » (découverte médias, pro, à propos). */
export const NAV_MORE: readonly PublicNavItem[] = [
  { href: "/videos", label: "Vidéos", icon: Play },
  { href: "/news", label: "Actu", icon: Newspaper },
  { href: "/movies", label: "Films", icon: Film },
  { href: "/music", label: "Musique", icon: Music },
  { href: "/intelligence", label: "Intelligence", icon: Activity },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/about", label: "À propos", icon: Info },
] as const;

export function isNavMoreActive(pathname: string): boolean {
  return NAV_MORE.some((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );
}
