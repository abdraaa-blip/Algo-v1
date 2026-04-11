import { notFound } from 'next/navigation'
import { isObservabilityDashboardEnabled } from '@/core/observability/guard'
import { ObservabilityDashboard } from './ObservabilityDashboard'

export default function ObservabilityPage() {
  if (!isObservabilityDashboardEnabled()) {
    notFound()
  }
  return <ObservabilityDashboard />
}
