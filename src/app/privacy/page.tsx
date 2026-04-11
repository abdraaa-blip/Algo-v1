import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo/build-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Confidentialité & données personnelles",
  description:
    "Politique de confidentialité ALGO : cookies, analytics optionnel, droits RGPD et traitement des données.",
  path: "/privacy",
  keywords: [
    "confidentialité",
    "RGPD",
    "données personnelles",
    "cookies",
    "ALGO",
  ],
});

export default function PrivacyPage() {
  return (
    <div className="min-h-0 w-full text-[var(--color-text-primary)]">
      <div className="max-w-2xl mx-auto px-4 py-12 pb-24">
        <p className="text-xs text-white/40 mb-6">
          <Link href="/" className="hover:text-white/70">
            ← Accueil
          </Link>
        </p>
        <h1 className="text-2xl font-bold mb-2">
          Politique de confidentialité
        </h1>
        <p className="text-sm text-white/55 mb-10">
          Dernière mise à jour : avril 2026. Cette page décrit comment ALGO
          traite les données · sans marketing, pour rester aligné avec ce que le
          site fait réellement.
        </p>

        <section className="space-y-4 text-sm text-white/70 leading-relaxed mb-10">
          <h2 className="text-base font-semibold text-white">
            1. Qui est responsable ?
          </h2>
          <p>
            L’éditeur du service ALGO. Identité, adresse et contact
            opérationnels : voir les{" "}
            <Link href="/legal" className="text-cyan-300 hover:underline">
              mentions légales
            </Link>{" "}
            (renseignées via{" "}
            <code className="text-xs text-white/50">
              NEXT_PUBLIC_SITE_OPERATOR_*
            </code>{" "}
            et{" "}
            <code className="text-xs text-white/50">
              NEXT_PUBLIC_CONTACT_EMAIL
            </code>
            ).
          </p>
        </section>

        <section className="space-y-4 text-sm text-white/70 leading-relaxed mb-10">
          <h2 className="text-base font-semibold text-white">
            2. Quelles données ?
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-white/85">
                Données techniques nécessaires
              </strong>{" "}
              : éléments indispensables au fonctionnement (par ex. cookies de
              session ou d’authentification si vous proposez un compte).
            </li>
            <li>
              <strong className="text-white/85">Préférences</strong> : choix
              stockés localement pour le bandeau cookies (localStorage), afin de
              respecter votre décision.
            </li>
            <li>
              <strong className="text-white/85">Analytics (optionnel)</strong> :
              si vous acceptez via le bandeau, une mesure d’audience peut être
              activée (ex. Plausible, configurée par{" "}
              <code className="text-xs text-cyan-200/80">
                NEXT_PUBLIC_PLAUSIBLE_DOMAIN
              </code>
              ) · visée anonymisée, sans publicité ciblée par défaut dans ce
              modèle.
            </li>
            <li>
              <strong className="text-white/85">
                Contenu que vous soumettez
              </strong>{" "}
              : textes ou liens analysés dans des outils comme l’analyseur viral
              sont traités pour produire un résultat ; ne publiez pas de données
              sensibles inutilement.
            </li>
          </ul>
        </section>

        <section className="space-y-4 text-sm text-white/70 leading-relaxed mb-10">
          <h2 className="text-base font-semibold text-white">
            3. Bases légales (RGPD)
          </h2>
          <p>
            Intérêt légitime et exécution du service pour le fonctionnement du
            site ; <strong>consentement</strong> pour l’analytics non
            essentielle ; contrat ou mesures précontractuelles si vous ouvrez un
            compte payant ou professionnel le cas échéant.
          </p>
        </section>

        <section className="space-y-4 text-sm text-white/70 leading-relaxed mb-10">
          <h2 className="text-base font-semibold text-white">
            4. Durée de conservation
          </h2>
          <p>
            Les préférences cookies restent jusqu’à ce que vous les modifiiez.
            Les logs et métriques dépendent de votre hébergeur et de l’outil
            d’analytics · à documenter précisément en production.
          </p>
        </section>

        <section className="space-y-4 text-sm text-white/70 leading-relaxed mb-10">
          <h2 className="text-base font-semibold text-white">5. Vos droits</h2>
          <p>
            Accès, rectification, effacement, limitation, opposition et
            portabilité lorsque le RGPD s’applique. Contactez l’éditeur ; vous
            pouvez aussi saisir l’autorité de protection des données de votre
            pays.
          </p>
        </section>

        <section className="space-y-4 text-sm text-white/70 leading-relaxed mb-10">
          <h2 className="text-base font-semibold text-white">
            6. Cookies & choix
          </h2>
          <p>
            Utilisez « Préférences cookies » en bas de page pour rouvrir le
            bandeau. Les scripts d’audience ne sont pas chargés tant que vous
            n’avez pas accepté l’option analytics.
          </p>
        </section>

        <section className="space-y-4 text-sm text-white/70 leading-relaxed mb-10">
          <h2 className="text-base font-semibold text-white">
            7. Scores et « intelligence »
          </h2>
          <p>
            Les scores et analyses affichés sont des{" "}
            <strong className="text-white/85">indicateurs estimés</strong>,
            basés sur des signaux publics et des modèles · pas des garanties de
            performance, d’audience ou de viralité réelle. Voir aussi{" "}
            <Link
              href="/transparency"
              className="text-cyan-300 hover:underline"
            >
              Transparence des données
            </Link>
            .
          </p>
        </section>

        <p className="text-xs text-white/40">
          <Link href="/legal" className="text-cyan-300/80 hover:underline">
            Mentions légales
          </Link>
          {" · "}
          <Link
            href="/transparency"
            className="text-cyan-300/80 hover:underline"
          >
            Transparence
          </Link>
          {" · "}
          <Link href="/about" className="text-cyan-300/80 hover:underline">
            À propos
          </Link>
        </p>
      </div>
    </div>
  );
}
