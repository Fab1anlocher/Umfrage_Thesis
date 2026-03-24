-- ============================================================
-- Umfrage Thesis – Supabase Schema
-- Run this in the Supabase SQL editor to set up all tables.
-- ============================================================

-- Drop existing tables (CASCADE handles foreign key dependencies)
DROP TABLE IF EXISTS responses    CASCADE;
DROP TABLE IF EXISTS banners      CASCADE;
DROP TABLE IF EXISTS participants CASCADE;

CREATE TABLE participants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  group_assignment      TEXT NOT NULL,   -- 'A' | 'B'
  age_group             TEXT NOT NULL,   -- '18-29' | '30-44' | '45-59' | '60+'
  gender                TEXT NOT NULL,   -- 'männlich' | 'weiblich'
  political_orientation INT  NOT NULL,   -- 1–5
  decision_style        TEXT NOT NULL    -- 'rational' | 'ausgewogen' | 'emotional'
);

CREATE TABLE banners (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id         INT  NOT NULL,   -- 1 | 2
  type                  TEXT NOT NULL,   -- 'personalized' | 'neutral'
  gender                TEXT,            -- 'männlich' | 'weiblich' (NULL for neutral)
  age_group             TEXT,            -- '18-29' | '30-44' | '45-59' | '60+' (NULL for neutral)
  political_orientation INT,             -- 1–5 (NULL for neutral)
  decision_style        TEXT,            -- 'rational' | 'ausgewogen' | 'emotional' (NULL for neutral)
  image_url             TEXT NOT NULL
);

CREATE TABLE responses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  participant_id        UUID NOT NULL REFERENCES participants(id),
  initiative_id         INT  NOT NULL,   -- 1 | 2
  group_assignment      TEXT NOT NULL,   -- 'A' | 'B' (denormalized for easier analysis)
  banner_type           TEXT NOT NULL,   -- 'personalized' | 'neutral' (what was actually shown)
  voting_intention      INT  NOT NULL,   -- 1–7 (1 = bestimmt Nein, 7 = bestimmt Ja)
  credibility           INT  NOT NULL,   -- 1–7
  personalization_felt  INT  NOT NULL,   -- 1–7
  fallback_used         BOOLEAN DEFAULT FALSE  -- true if personalized was intended but unavailable
);

-- Indexes for common query patterns
CREATE INDEX idx_responses_participant_id ON responses(participant_id);
CREATE INDEX idx_responses_initiative_id  ON responses(initiative_id);
CREATE INDEX idx_banners_lookup           ON banners(initiative_id, type, gender, age_group, political_orientation, decision_style);
