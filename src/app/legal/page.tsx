import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo/build-metadata";
import { getSiteBaseUrl } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Mentions légales",
  description:
    "Éditeur, hébergement et contact du service ALGO · informations à compléter via les variables d’environnement en production.",
  path: "/legal",
  keywords: ["mentions légales", "éditeur", "hébergement", "ALGO"],
});

function envOrPlaceholder(key: string, fallback: string) {
  const v = process.env[key];
  return v && v.trim() ? v.trim() : fallback;
}

export default function LegalPage() {
  const baseUrl = getSiteBaseUrl();
  const operator = envOrPlaceholder(
    "NEXT_PUBLIC_SITE_OPERATOR_NAME",
    "[À renseigner : NEXT_PUBLIC_SITE_OPERATOR_NAME]",
  );
  const address = envOrPlaceholder(
    "NEXT_PUBLIC_SITE_OPERATOR_ADDRESS",
    "[Adresse du siège / représentant légal · NEXT_PUBLIC_SITE_OPERATOR_ADDRESS]",
  );
  const contactEmail = envOrPlaceholder(
    "NEXT_PUBLIC_CONTACT_EMAIL",
    "[NEXT_PUBLIC_CONTACT_EMAIL]",
  );
  const hosting = envOrPlaceholder(
    "NEXT_PUBLIC_SITE_HOSTING",
    "[Hébergeur et adresse · NEXT_PUBLIC_SITE_HOSTING, ex. Vercel Inc.]",
  );
  const mailOk = /^[^\s@[\]]+@[^\s@[\]]+\.[^\s@[\]]+$/.test(contactEmail);

  return (
    <div className="min-h-screen text-[var(--color-text-primary)]">
      <div className="max-w-2xl mx-auto px-4 py-12 pb-24">
        <p className="text-xs text-white/40 mb-6">
          <Link href="/" className="hover:text-white/70">
            ← Accueil
          </Link>
        </p>
        <h1 className="text-2xl font-bold mb-2">Mentions légales</h1>
        <p className="text-sm text-white/55 mb-10">
          Informations relatives à l’édition du site{" "}
          <span className="text-white/75">{baseUrl}</span>. Les valeurs entre
          crochets disparaissent lorsque vous définissez les variables
          d’environnement indiquées.
        </p>

        <section className="space-y-3 text-sm text-white/70 leading-relaxed mb-10">
          <h2 className="text-base font-semibold text-white">1. Éditeur</h2>
          <p>
            <strong className="text-white/85">
              Raison sociale / nom public :
            </strong>{" "}
            {operator}
          </p>
          <p>
            <strong className="text-white/85">Coordonnées :</strong> {address}
          </p>
          <p>
            <strong className="text-white/85">Contact :</strong>{" "}
            {mailOk ? (
              <a
                href={`mailto:${contactEmail}`}
                className="text-cyan-300 hover:underline"
              >
                {contactEmail}
              </a>
            ) : (
              <span className="text-white/60">{contactEmail}</span>
            )}
          </p>
        </section>

        <section className="space-y-3 text-sm text-white/70 leading-relaxed mb-10">
          <h2 className="text-base font-semibold text-white">2. Hébergement</h2>
          <p>{hosting}</p>
        </section>

        <section className="space-y-3 text-sm text-white/70 leading-relaxed mb-10">
          <h2 className="text-base font-semibold text-white">
            3. Propriété intellectuelle
          </h2>
          <p>
            La marque, l’interface et les contenus éditoriaux propres à ALGO
            sont protégés. Les données issues de tiers (APIs, flux) restent la
            propriété de leurs titulaires ; ALGO les agrège à des fins
            d’information et d’analyse.
          </p>
        </section>

        <section className="space-y-3 text-sm text-white/70 leading-relaxed mb-10">
          <h2 className="text-base font-semibold text-white">
            4. Limitation de responsabilité
          </h2>
          <p>
            Les scores, tendances et suggestions sont des{" "}
            <strong className="text-white/85">indicateurs</strong> à titre
            d’aide à la décision, sans garantie de résultat. L’utilisateur reste
            seul responsable de l’usage qu’il fait des informations affichées.
          </p>
        </section>

        <p className="text-xs text-white/40">
          <Link href="/privacy" className="text-cyan-300/80 hover:underline">
            Politique de confidentialité
          </Link>
          {" · "}
          <Link
            href="/transparency"
            className="text-cyan-300/80 hover:underline"
          >
            Transparence des données
          </Link>
        </p>
      </div>
    </div>
  );
}
