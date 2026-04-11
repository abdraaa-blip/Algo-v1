import type { Metadata } from "next";
import { LoginClientShell } from "./LoginClientShell";
import { buildPageMetadata } from "@/lib/seo/build-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Connexion",
  description: "Connexion à ton compte ALGO.",
  path: "/login",
  noindex: true,
});

export default function LoginPage() {
  const labels = {
    title: "Connexion",
    email: "Email",
    password: "Mot de passe",
    submit: "Se connecter",
    google: "Continuer avec Google",
    noAccount: "Pas de compte ?",
    signup: "Créer un compte",
    or: "ou",
  };

  return <LoginClientShell labels={labels} />;
}
