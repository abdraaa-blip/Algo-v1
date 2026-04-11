import type { MetadataRoute } from "next";
import { getSiteBaseUrl } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteBaseUrl();
  const now = new Date();

  const staticPages: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
    priority: number;
  }[] = [
    { path: "", changeFrequency: "hourly", priority: 1 },
    { path: "/trends", changeFrequency: "hourly", priority: 0.95 },
    { path: "/trending", changeFrequency: "hourly", priority: 0.85 },
    { path: "/videos", changeFrequency: "hourly", priority: 0.9 },
    { path: "/news", changeFrequency: "hourly", priority: 0.9 },
    { path: "/movies", changeFrequency: "daily", priority: 0.82 },
    { path: "/stars", changeFrequency: "daily", priority: 0.8 },
    { path: "/rising-stars", changeFrequency: "daily", priority: 0.78 },
    { path: "/music", changeFrequency: "daily", priority: 0.78 },
    { path: "/search", changeFrequency: "weekly", priority: 0.85 },
    { path: "/creator-mode", changeFrequency: "weekly", priority: 0.8 },
    { path: "/ai", changeFrequency: "daily", priority: 0.9 },
    { path: "/viral-analyzer", changeFrequency: "daily", priority: 0.88 },
    { path: "/algorithm", changeFrequency: "weekly", priority: 0.72 },
    { path: "/transparency", changeFrequency: "monthly", priority: 0.55 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.45 },
    { path: "/legal", changeFrequency: "yearly", priority: 0.45 },
    { path: "/status", changeFrequency: "daily", priority: 0.5 },
    { path: "/onboarding", changeFrequency: "monthly", priority: 0.6 },
    { path: "/intelligence", changeFrequency: "hourly", priority: 0.88 },
    { path: "/about", changeFrequency: "monthly", priority: 0.65 },
  ];

  return staticPages.map(({ path, changeFrequency, priority }) => ({
    url: path === "" ? baseUrl : `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
