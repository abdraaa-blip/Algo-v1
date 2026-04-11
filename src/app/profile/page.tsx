import type { Metadata } from "next";
import { ProfileClientShell } from "./ProfileClientShell";
import { buildPageMetadata } from "@/lib/seo/build-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Profil",
  description: "Ton profil et préférences ALGO.",
  path: "/profile",
  noindex: true,
});

export default function ProfilePage() {
  const labels = {
    title: "Mon Profil",
    guest: "Invite",
    guestSub: "Connecte-toi pour sauvegarder tes preferences",
    login: "Se connecter",
    signup: "Créer un compte",
    logout: "Se deconnecter",
    favorites: "Favoris",
    watchlist: "Watchlist",
    settings: "Parametres",
    tagline: "Le web viral des tendances",
    member: "Membre ALGO",
  };

  return <ProfileClientShell labels={labels} />;
}
