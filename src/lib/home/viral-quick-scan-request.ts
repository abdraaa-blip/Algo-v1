/** Shared with HomeFirstMoments — must match POST /api/viral-analyzer form fields. */
export type ViralQuickScanPlatform =
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'twitter'
  | 'reddit'

export function buildViralAnalyzerFormDataUrl(url: string, platform: ViralQuickScanPlatform): FormData {
  const fd = new FormData()
  fd.append('locale', 'fr')
  fd.append('mode', 'url')
  fd.append('url', url.trim())
  fd.append('platform', platform)
  return fd
}

export function buildViralAnalyzerFormDataDescription(
  description: string,
  platform: ViralQuickScanPlatform
): FormData {
  const fd = new FormData()
  fd.append('locale', 'fr')
  fd.append('mode', 'description')
  fd.append('description', description.trim())
  fd.append('platform', platform)
  return fd
}
