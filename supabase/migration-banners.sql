-- Migration: Create banners table for admin hero banner management
-- Run this in the Supabase SQL Editor before starting the auth-service.

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  badge TEXT NOT NULL,
  cta TEXT NOT NULL,
  link TEXT NOT NULL,
  gradient TEXT NOT NULL,
  image TEXT NOT NULL,
  accent TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for public endpoint: fetch active banners sorted by order
CREATE INDEX IF NOT EXISTS idx_banners_active_order ON banners (is_active, "order");

COMMENT ON TABLE banners IS 'Homepage hero carousel banners managed by admin panel';
