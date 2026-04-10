import { createClient } from '@supabase/supabase-js'
import { getSupabasePublicApiKey, getSupabaseSecretApiKey, getSupabaseUrl } from '@/lib/supabase/env-keys'

export interface OpsIncident {
  id: string
  at: string
  severity: 'low' | 'medium' | 'high'
  title: string
  details: string
  actions: string[]
}

const INCIDENT_LIMIT = 500
const incidents: OpsIncident[] = []

function getSupabaseClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseSecretApiKey() || getSupabasePublicApiKey()
  if (!url || !key) return null
  return createClient(url, key)
}

export function pushIncident(entry: Omit<OpsIncident, 'id' | 'at'>): OpsIncident {
  const full: OpsIncident = {
    id: `incident_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    ...entry,
  }
  incidents.push(full)
  if (incidents.length > INCIDENT_LIMIT) incidents.splice(0, incidents.length - INCIDENT_LIMIT)
  return full
}

export function getIncidents(limit = 100): OpsIncident[] {
  const size = Math.max(1, Math.min(300, limit))
  return incidents.slice(-size).reverse()
}

export async function persistIncident(entry: OpsIncident): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return
  await supabase.from('analytics_events').insert({
    event_type: 'ops_incident',
    event_name: entry.title,
    page_path: '/intelligence/ops',
    properties: entry,
  })
}
