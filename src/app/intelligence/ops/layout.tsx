import type { Metadata } from 'next'

/** Centre ops : ne pas indexer. */
export const metadata: Metadata = {
  title: 'Ops Center · ALGO',
  robots: { index: false, follow: false },
}

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return children
}
