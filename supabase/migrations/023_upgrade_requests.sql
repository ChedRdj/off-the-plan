-- Persist upgrade / promo-flag / feature requests submitted by portal members
-- so the admin can act on them. Previously the endpoint only logged to stdout.

CREATE TABLE IF NOT EXISTS upgrade_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  development_id  uuid REFERENCES developments(id) ON DELETE SET NULL,
  upgrade_type    text NOT NULL,
  start_date      date,
  end_date        date,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS upgrade_requests_status_idx ON upgrade_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS upgrade_requests_user_idx ON upgrade_requests (user_id);

ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages upgrade_requests"
  ON upgrade_requests FOR ALL USING (auth.role() = 'service_role');
