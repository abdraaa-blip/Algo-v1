import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { buildRootMetadata } from "@/lib/seo/build-metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import "./globals.css";

export const metadata: Metadata = buildRootMetadata();

export const viewport: Viewport = {
  themeColor: "#07070f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  userScalable: true, // Required for WCAG 2.1 compliance
  /** iOS / encoches : active env(safe-area-inset-*) pour le chrome fixe */
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationLd = organizationJsonLd();
  const websiteLd = websiteJsonLd();

  return (
    <html
      lang="fr"
      dir="ltr"
      data-scroll-behavior="smooth"
      data-algo-view="focus"
    >
      <head>
        {/* Preconnect to critical third-party origins - Chrome team PRPL pattern */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://www.googleapis.com" />
        <link rel="preconnect" href="https://api.themoviedb.org" />

        {/* DNS prefetch for secondary resources */}
        <link rel="dns-prefetch" href="https://news.google.com" />
        <link rel="dns-prefetch" href="https://api.github.com" />

        {/* Suppress benign Performance.measure errors from Next.js internals */}
        <Script
          id="performance-measure-fix"
          strategy="beforeInteractive"
        >{`(function(){var o=window.performance&&window.performance.measure;if(o){window.performance.measure=function(n,s,e){try{return o.call(this,n,s,e)}catch(x){return null}}}})();`}</Script>
        <Script
          id="organization-ld"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify(organizationLd)}
        </Script>
        <Script
          id="website-ld"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify(websiteLd)}
        </Script>
      </head>
      <body className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] antialiased overflow-x-hidden selection:bg-[var(--color-violet-muted)] selection:text-[var(--color-text-primary)]">
        {/* Skip to content link for keyboard accessibility */}
        <a href="#main-content" className="skip-to-content">
          Aller au contenu principal
        </a>
        <ClientProviders>
          <ClientLayout>{children}</ClientLayout>
        </ClientProviders>
      </body>
    </html>
  );
}
