import { createClient } from "@supabase/supabase-js";
import {
  getSupabasePublicApiKey,
  getSupabaseSecretApiKey,
  getSupabaseUrl,
} from "@/lib/supabase/env-keys";

export interface KnowledgeMemoryEntry {
  id: string;
  createdAt: string;
  region: string;
  domain: "viral" | "behavior" | "product" | "economic" | "science" | "ux";
  summary: string;
  signals: string[];
  confidence: number;
  outcome?: "positive" | "neutral" | "negative";
  tags?: string[];
}

const MEMORY_LIMIT = 1500;
const memoryStore: KnowledgeMemoryEntry[] = [];

function getSupabaseClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseSecretApiKey() || getSupabasePublicApiKey();
  if (!url || !key) return null;
  return createClient(url, key);
}

export function addKnowledgeMemory(
  entry: Omit<KnowledgeMemoryEntry, "id" | "createdAt">,
): KnowledgeMemoryEntry {
  const full: KnowledgeMemoryEntry = {
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...entry,
  };
  memoryStore.push(full);
  if (memoryStore.length > MEMORY_LIMIT) {
    memoryStore.splice(0, memoryStore.length - MEMORY_LIMIT);
  }
  return full;
}

export async function persistKnowledgeMemory(
  entry: KnowledgeMemoryEntry,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase.from("knowledge_memory").insert({
    id: entry.id,
    created_at: entry.createdAt,
    region: entry.region,
    domain: entry.domain,
    summary: entry.summary,
    signals: entry.signals,
    confidence: entry.confidence,
    outcome: entry.outcome ?? null,
    tags: entry.tags ?? [],
  });
  if (!error) return;

  await supabase.from("analytics_events").insert({
    event_type: "knowledge_memory",
    event_name: "intelligence_memory_entry",
    page_path: "/intelligence",
    properties: entry,
  });
}

export function getKnowledgeMemory(
  limit = 100,
  domain?: KnowledgeMemoryEntry["domain"],
) {
  const filtered = domain
    ? memoryStore.filter((m) => m.domain === domain)
    : memoryStore;
  return filtered.slice(-Math.max(1, Math.min(500, limit))).reverse();
}

export async function getDurableKnowledgeMemory(
  limit = 100,
  domain?: KnowledgeMemoryEntry["domain"],
): Promise<KnowledgeMemoryEntry[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return getKnowledgeMemory(limit, domain);

  const size = Math.max(1, Math.min(500, limit));
  const tableQuery = supabase
    .from("knowledge_memory")
    .select(
      "id, created_at, region, domain, summary, signals, confidence, outcome, tags",
    )
    .order("created_at", { ascending: false })
    .limit(size);

  const { data: tableRows, error: tableError } = domain
    ? await tableQuery.eq("domain", domain)
    : await tableQuery;

  if (!tableError && Array.isArray(tableRows) && tableRows.length > 0) {
    return tableRows.map((row) => ({
      id: String(row.id),
      createdAt: String(row.created_at),
      region: String(row.region),
      domain: row.domain as KnowledgeMemoryEntry["domain"],
      summary: String(row.summary),
      signals: Array.isArray(row.signals) ? row.signals.map(String) : [],
      confidence: Number(row.confidence) || 0,
      outcome: row.outcome as KnowledgeMemoryEntry["outcome"],
      tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    }));
  }

  const analyticsQuery = supabase
    .from("analytics_events")
    .select("properties, created_at")
    .eq("event_type", "knowledge_memory")
    .order("created_at", { ascending: false })
    .limit(size);
  const { data: analyticsRows } = await analyticsQuery;
  if (Array.isArray(analyticsRows) && analyticsRows.length > 0) {
    const mapped = analyticsRows
      .map((row) => row.properties as Partial<KnowledgeMemoryEntry> | null)
      .filter(Boolean)
      .map((p) => ({
        id: String(
          p?.id ||
            `legacy_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ),
        createdAt: String(p?.createdAt || new Date().toISOString()),
        region: String(p?.region || "GLOBAL"),
        domain: (p?.domain as KnowledgeMemoryEntry["domain"]) || "viral",
        summary: String(p?.summary || ""),
        signals: Array.isArray(p?.signals) ? p.signals.map(String) : [],
        confidence: Number(p?.confidence) || 0,
        outcome: p?.outcome as KnowledgeMemoryEntry["outcome"],
        tags: Array.isArray(p?.tags) ? p.tags.map(String) : [],
      }));
    return domain ? mapped.filter((m) => m.domain === domain) : mapped;
  }

  return getKnowledgeMemory(limit, domain);
}
