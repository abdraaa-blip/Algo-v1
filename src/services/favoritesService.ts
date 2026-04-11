// =============================================================================
// ALGO V1 · favoritesService
// Persistance localStorage en V1.
// En V2 : remplacer par des appels Supabase · signature identique.
// =============================================================================

import { mockContent } from "@/data/mock-content";
import type { Content } from "@/types";

const STORAGE_KEY = "algo_favorites";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore · storage indisponible
  }
}

export function getFavoriteIds(): string[] {
  return readIds();
}

export function addFavorite(contentId: string): string[] {
  const current = readIds();
  if (current.includes(contentId)) return current;
  const updated = [...current, contentId];
  writeIds(updated);
  return updated;
}

export function removeFavorite(contentId: string): string[] {
  const updated = readIds().filter((id) => id !== contentId);
  writeIds(updated);
  return updated;
}

export function isFavorite(contentId: string): boolean {
  return readIds().includes(contentId);
}

export function getFavoriteContents(): Content[] {
  const ids = readIds();
  return mockContent.filter((c) => ids.includes(c.id));
}

export function toggleFavorite(contentId: string): {
  isFav: boolean;
  ids: string[];
} {
  if (isFavorite(contentId)) {
    return { isFav: false, ids: removeFavorite(contentId) };
  }
  return { isFav: true, ids: addFavorite(contentId) };
}
