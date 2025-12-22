-- Migration: Add AI Parse Cache Table
-- Created: 2025-12-22
-- Purpose: Cache AI parsing results to avoid redundant API calls

CREATE TABLE IF NOT EXISTS ai_parse_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  input_hash TEXT NOT NULL UNIQUE,
  input_text TEXT NOT NULL,
  parse_type TEXT NOT NULL CHECK (parse_type IN ('meal', 'gym', 'general')),
  parsed_result JSONB NOT NULL,
  model TEXT NOT NULL DEFAULT 'xiaomi/mimo-v2-flash:free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_count INTEGER NOT NULL DEFAULT 1
);

-- Indexes for fast lookup
CREATE INDEX idx_ai_parse_cache_input_hash ON ai_parse_cache(input_hash);
CREATE INDEX idx_ai_parse_cache_parse_type ON ai_parse_cache(parse_type);
CREATE INDEX idx_ai_parse_cache_created_at ON ai_parse_cache(created_at DESC);

-- Trigger to update last_accessed_at on cache hit
CREATE OR REPLACE FUNCTION update_cache_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at = NOW();
  NEW.access_count = OLD.access_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_parse_cache_access
BEFORE UPDATE ON ai_parse_cache
FOR EACH ROW
EXECUTE FUNCTION update_cache_access();

-- Comments
COMMENT ON TABLE ai_parse_cache IS 'Caches AI parsing results to avoid redundant OpenRouter API calls';
COMMENT ON COLUMN ai_parse_cache.input_hash IS 'SHA-256 hash of normalized input text for deduplication';
COMMENT ON COLUMN ai_parse_cache.parse_type IS 'Type of parsing: meal, gym, or general';
COMMENT ON COLUMN ai_parse_cache.parsed_result IS 'Structured JSON result from AI parsing';
COMMENT ON COLUMN ai_parse_cache.access_count IS 'Number of times this cached result was used';
