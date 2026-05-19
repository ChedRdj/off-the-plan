-- Allow developer_leads to also store generic contact-form submissions where
-- there is no specific development name yet, and tag the origin form.

ALTER TABLE developer_leads
  ALTER COLUMN development_name DROP NOT NULL;

ALTER TABLE developer_leads
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'list-a-listing';

ALTER TABLE developer_leads
  ADD COLUMN IF NOT EXISTS subject text;

ALTER TABLE developer_leads
  ADD COLUMN IF NOT EXISTS message text;
