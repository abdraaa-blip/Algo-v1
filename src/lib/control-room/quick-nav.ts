/**
 * Liens discrets pour la control room (navigation rapide).
 * Pas de logique « cognitive » — simple liste stable.
 */
export const CONTROL_ROOM_QUICK_NAV: ReadonlyArray<{
  href: string;
  label: string;
}> = [
  { href: "/", label: "Accueil" },
  { href: "/control-center", label: "Control Center" },
  { href: "/brain-interface", label: "Brain Interface" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/intelligence", label: "Intelligence" },
  { href: "/trends", label: "Tendances" },
  { href: "/ai", label: "ALGO AI" },
  { href: "/status", label: "Statut" },
  { href: "/settings", label: "Réglages" },
];
