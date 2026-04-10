import { timingSafeEqual, createHash } from 'crypto'

/**
 * Authentification des intégrations externes (apps mobiles / partenaires).
 *
 * Variables d’environnement :
 * - `ALGO_PLATFORM_API_KEY` : une clé secrète (simple déploiement)
 * - `ALGO_PLATFORM_API_KEYS` : liste séparée par des virgules (plusieurs clients)
 *
 * En-têtes supportés :
 * - `Authorization: Bearer <clé>`
 * - `X-ALGO-Platform-Key: <clé>`
 */

function configuredKeys(): string[] {
  const single = process.env.ALGO_PLATFORM_API_KEY?.trim()
  const multi =
    process.env.ALGO_PLATFORM_API_KEYS?.split(',').map((k) => k.trim()).filter(Boolean) ?? []
  const set = new Set<string>(multi)
  if (single) set.add(single)
  return [...set]
}

export function platformApiKeysConfigured(): boolean {
  return configuredKeys().length > 0
}

export function extractPlatformApiKey(request: Request): string | null {
  const direct = request.headers.get('x-algo-platform-key')?.trim()
  if (direct) return direct
  const auth = request.headers.get('authorization')
  if (auth?.toLowerCase().startsWith('bearer ')) {
    const t = auth.slice(7).trim()
    return t || null
  }
  return null
}

export function verifyPlatformApiKey(provided: string | null): boolean {
  if (!provided) return false
  const keys = configuredKeys()
  if (keys.length === 0) return false
  const buf = Buffer.from(provided, 'utf8')
  for (const k of keys) {
    const kb = Buffer.from(k, 'utf8')
    if (buf.length !== kb.length) continue
    try {
      if (timingSafeEqual(buf, kb)) return true
    } catch {
      // ignore
    }
  }
  return false
}

/** Empreinte pour rate limiting / logs (pas réversible vers la clé). */
export function fingerprintPlatformKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex').slice(0, 24)
}
