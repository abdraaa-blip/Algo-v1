import type { MetadataRoute } from "next";
import { getSiteBaseUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/settings",
          "/watchlist",
          "/favorites",
          "/maintenance",
          "/offline",
          "/fail-lab",
          "/design-system",
          "/login",
          "/signup",
          "/intelligence/ops",
          "/intelligence/logs",
          "/intelligence/learning",
          "/profile",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
