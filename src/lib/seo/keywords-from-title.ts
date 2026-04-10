const STOP = new Set([
  'le',
  'la',
  'les',
  'un',
  'une',
  'des',
  'du',
  'de',
  'et',
  'en',
  'au',
  'aux',
  'a',
  'the',
  'an',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
])

/** Tokens from a headline for SEO keywords and UI tags (Title Case, max `max`). */
export function extractTitleKeywords(title: string, max = 5): string[] {
  const words = title
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\u00C0-\u017F\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w))

  return [...new Set(words)]
    .slice(0, max)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
}
