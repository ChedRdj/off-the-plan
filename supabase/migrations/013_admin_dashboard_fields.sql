-- Add missing fields to circle_signups for Property Alert Sign Ups
ALTER TABLE circle_signups
  ADD COLUMN IF NOT EXISTS phone         text,
  ADD COLUMN IF NOT EXISTS state         text,
  ADD COLUMN IF NOT EXISTS occupation    text,
  ADD COLUMN IF NOT EXISTS message       text,
  ADD COLUMN IF NOT EXISTS hear_about_us text,
  ADD COLUMN IF NOT EXISTS postcode      text,
  ADD COLUMN IF NOT EXISTS agency        text,
  ADD COLUMN IF NOT EXISTS project_name  text;

-- Media Kit Enquiries table
CREATE TABLE IF NOT EXISTS media_kit_enquiries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    text NOT NULL,
  email        text NOT NULL,
  phone        text,
  category     text,
  state        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE media_kit_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages media_kit_enquiries"
  ON media_kit_enquiries FOR ALL USING (auth.role() = 'service_role');
