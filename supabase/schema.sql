-- Phantom Tracker Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Pain entries table
CREATE TABLE IF NOT EXISTS pain_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Pain location (3D coordinates on foot model)
  pain_point_x FLOAT NOT NULL,
  pain_point_y FLOAT NOT NULL,
  pain_point_z FLOAT NOT NULL,
  pain_point_name TEXT,
  
  -- Pain intensity (1-10)
  pain_level INTEGER NOT NULL CHECK (pain_level BETWEEN 1 AND 10),
  
  -- Environmental data snapshot (all data combined)
  environmental_data JSONB NOT NULL,
  
  -- Location used for data lookup
  latitude FLOAT,
  longitude FLOAT,
  
  -- For future auth
  user_id TEXT
);

-- Indexes for correlation queries
CREATE INDEX IF NOT EXISTS idx_pain_entries_created_at ON pain_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_pain_entries_env_data ON pain_entries USING GIN(environmental_data);
CREATE INDEX IF NOT EXISTS idx_pain_entries_pain_level ON pain_entries(pain_level);
CREATE INDEX IF NOT EXISTS idx_pain_entries_user_id ON pain_entries(user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_pain_entries_updated_at ON pain_entries;
CREATE TRIGGER update_pain_entries_updated_at
  BEFORE UPDATE ON pain_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (for when auth is added)
ALTER TABLE pain_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own entries (when user_id is set)
-- For now, allow all access since we don't have auth yet
CREATE POLICY "Allow all access for now"
  ON pain_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Useful views for analytics

-- View: Pain entries with weather correlation data extracted
CREATE OR REPLACE VIEW pain_with_weather AS
SELECT
  id,
  created_at,
  pain_level,
  pain_point_name,
  (environmental_data->'weather'->>'pressure')::FLOAT AS pressure,
  (environmental_data->'weather'->>'temperature')::FLOAT AS temperature,
  (environmental_data->'weather'->>'humidity')::INTEGER AS humidity,
  environmental_data->'weather'->>'pressure_trend' AS pressure_trend,
  environmental_data->'lunar'->>'phase_name' AS lunar_phase,
  (environmental_data->'lunar'->>'illumination')::FLOAT AS lunar_illumination,
  (environmental_data->'geomagnetic'->>'kp_index')::INTEGER AS kp_index,
  environmental_data->'solar'->>'xray_class' AS solar_class
FROM pain_entries;

-- View: Daily pain statistics
CREATE OR REPLACE VIEW daily_pain_stats AS
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS entry_count,
  AVG(pain_level) AS avg_pain_level,
  MAX(pain_level) AS max_pain_level,
  MIN(pain_level) AS min_pain_level
FROM pain_entries
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View: Pain by body region
CREATE OR REPLACE VIEW pain_by_region AS
SELECT
  COALESCE(pain_point_name, 'Unknown') AS region,
  COUNT(*) AS entry_count,
  AVG(pain_level) AS avg_pain_level,
  ROUND(COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM pain_entries) * 100, 1) AS percentage
FROM pain_entries
GROUP BY pain_point_name
ORDER BY entry_count DESC;
