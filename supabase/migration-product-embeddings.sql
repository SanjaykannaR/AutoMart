-- ─────────────────────────────────────────────────────────────────────────────
-- RAG: product_embeddings table for semantic search (pgvector)
-- Run in Supabase SQL Editor (Project → SQL Editor → New query → Run).
-- Requires pgvector, which is available on the Supabase free plan.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS product_embeddings (
  product_id  uuid PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  model       text NOT NULL DEFAULT 'all-MiniLM-L6-v2',
  embedding   vector(384) NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- HNSW index for fast approximate kNN (cosine distance). Works well for
-- small-to-medium catalogs; the assistant-service queries with `<=>` (cosine).
CREATE INDEX IF NOT EXISTS product_embeddings_hnsw_idx
  ON product_embeddings USING hnsw (embedding vector_cosine_ops);

COMMENT ON TABLE product_embeddings IS
  'Semantic embeddings for RAG product recommendations (populated by assistant-service embedding worker)';
