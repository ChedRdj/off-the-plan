CREATE TABLE IF NOT EXISTS listing_agents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id   uuid NOT NULL REFERENCES developments(id) ON DELETE CASCADE,
  name             text,
  email            text,
  mobile           text,
  photo_url        text,
  sort_order       int NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE listing_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to listing_agents"
  ON listing_agents FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public can read agents of published listings"
  ON listing_agents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM developments d
    WHERE d.id = development_id AND d.is_published = true
  ));
