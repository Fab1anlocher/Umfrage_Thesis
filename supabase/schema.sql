-- ============================================================
-- Umfrage Thesis – Supabase Schema
-- Run this in the Supabase SQL editor to set up all tables.
-- ============================================================

CREATE TABLE participants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  group_assignment      TEXT NOT NULL,   -- 'A' | 'B'
  age                   INT NOT NULL,
  region_type           TEXT NOT NULL,   -- 'stadt' | 'agglomeration' | 'land'
  gender                TEXT NOT NULL,
  political_orientation INT NOT NULL,    -- 1–5
  decision_style        INT NOT NULL     -- 1–5
);

CREATE TABLE banners (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id         INT NOT NULL,    -- 1 | 2
  type                  TEXT NOT NULL,   -- 'personalized' | 'neutral'
  age_group             TEXT,            -- '18-29' | '30-44' | '45-59' | '60+' (NULL for neutral)
  political_orientation INT,             -- 1–5 (NULL for neutral)
  decision_style        TEXT,            -- 'rational' | 'emotional' (NULL for neutral)
  image_url             TEXT NOT NULL
);

CREATE TABLE responses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  participant_id        UUID NOT NULL REFERENCES participants(id),
  initiative_id         INT NOT NULL,
  group_assignment      TEXT NOT NULL,   -- 'A' | 'B' (denormalized for easier analysis)
  banner_a_type         TEXT NOT NULL,   -- 'personalized' | 'neutral'
  banner_b_type         TEXT NOT NULL,   -- 'personalized' | 'neutral'
  voting_intention      INT NOT NULL,    -- 1–5
  preferred_banner      TEXT NOT NULL,   -- 'A' | 'B' | 'none'
  persuasiveness_a      INT NOT NULL,    -- 1–5
  persuasiveness_b      INT NOT NULL,    -- 1–5
  fallback_used         BOOLEAN DEFAULT FALSE
);

-- Optional: add indexes for common query patterns
CREATE INDEX idx_responses_participant_id ON responses(participant_id);
CREATE INDEX idx_responses_initiative_id ON responses(initiative_id);
CREATE INDEX idx_banners_lookup ON banners(initiative_id, type, age_group, political_orientation, decision_style);
