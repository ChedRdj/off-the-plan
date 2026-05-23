-- Pre-handover polish migration: codifies the homepage_banners table that
-- was created manually in Studio, fixes the enquiries → developments FK so
-- admins can delete listings, adds a self-read policy on upgrade_requests,
-- and attaches the updated_at trigger to tables that were missing it.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. homepage_banners — codify the table so fresh environments can rebuild
--    purely from migrations. RLS was enabled in 022 but no service-role policy
--    was created, so the table has been silently service-role-only via the
--    fact that supabaseAdmin bypasses RLS. Add an explicit policy anyway.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS homepage_banners (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title              text,
  link               text,
  description        text,
  desktop_image_url  text,
  mobile_image_url   text,
  sort_order         int NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE homepage_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages homepage_banners" ON homepage_banners;
CREATE POLICY "Service role manages homepage_banners"
  ON homepage_banners FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. enquiries.development_id — currently NOT NULL and missing ON DELETE.
--    Deleting a listing fails with a FK violation. Preserve enquiry data
--    by allowing development_id to be set to NULL on parent delete.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE enquiries ALTER COLUMN development_id DROP NOT NULL;
ALTER TABLE enquiries DROP CONSTRAINT IF EXISTS enquiries_development_id_fkey;
ALTER TABLE enquiries
  ADD CONSTRAINT enquiries_development_id_fkey
  FOREIGN KEY (development_id) REFERENCES developments(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. upgrade_requests — let users read their own submissions via the
--    anon-key client. Previously only service-role could read.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can read own upgrade_requests" ON upgrade_requests;
CREATE POLICY "Users can read own upgrade_requests"
  ON upgrade_requests FOR SELECT
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Attach update_updated_at_column trigger to tables that were missing it.
--    The function itself was defined in 002_developments.sql.
-- ─────────────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS set_updated_at_agencies ON agencies;
CREATE TRIGGER set_updated_at_agencies
  BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_ads ON ads;
CREATE TRIGGER set_updated_at_ads
  BEFORE UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_upgrade_requests ON upgrade_requests;
CREATE TRIGGER set_updated_at_upgrade_requests
  BEFORE UPDATE ON upgrade_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_homepage_banners ON homepage_banners;
CREATE TRIGGER set_updated_at_homepage_banners
  BEFORE UPDATE ON homepage_banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
