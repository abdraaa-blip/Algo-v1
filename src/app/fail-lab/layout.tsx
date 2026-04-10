import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fail lab — ALGO',
  robots: { index: false, follow: false },
}

export default function FailLabLayout({ children }: { children: React.ReactNode }) {
  return children
}
