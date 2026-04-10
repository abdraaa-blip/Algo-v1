-- ALGO Learning Persistence Tables
-- Dedicated durable storage for autonomy learning and knowledge memory

CREATE TABLE IF NOT EXISTS autonomy_learning_logs (
  id TEXT PRIMARY KEY,
  at TIMESTAMPTZ NOT NULL,
  applied BOOLEAN NOT NULL DEFAULT FALSE,
  previous_min_confidence NUMERIC(5,4) NOT NULL,
  next_min_confidence NUMERIC(5,4) NOT NULL,
  helpful_ratio NUMERIC(5,4) NOT NULL DEFAULT 0,
  wrong_ratio NUMERIC(5,4) NOT NULL DEFAULT 0,
  total_feedback INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_autonomy_learning_logs_at
  ON autonomy_learning_logs(at DESC);

CREATE TABLE IF NOT EXISTS knowledge_memory (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL,
  region TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('viral', 'behavior', 'product', 'economic', 'science', 'ux')),
  summary TEXT NOT NULL,
  signals TEXT[] NOT NULL DEFAULT '{}',
  confidence NUMERIC(5,4) NOT NULL DEFAULT 0,
  outcome TEXT NULL CHECK (outcome IN ('positive', 'neutral', 'negative')),
  tags TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_knowledge_memory_created_at
  ON knowledge_memory(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_knowledge_memory_domain
  ON knowledge_memory(domain);
