-- Analytics + legacy import support.
--
-- 1. enquiry_count on developments — Tim's legacy export (OTP_Data_Export
--    _2026-06-12.xlsx) carries a per-listing enquiry count we need to
--    preserve. Going forward this is incremented by the /api/enquiries
--    route via the new RPC below, matching the existing view_count /
--    phone_click_count pattern from migration 014.
--
-- 2. source column on media_kit_enquiries — circle_signups already has
--    one (mig 005) and developer_leads already has one (mig 022); this
--    aligns media_kit_enquiries so the upcoming legacy import can tag
--    its 17 rows the same way ('legacy_import_2026_06_12').
alter table developments
  add column if not exists enquiry_count int not null default 0;

alter table media_kit_enquiries
  add column if not exists source text default 'organic';

create or replace function increment_enquiry_count(dev_id uuid)
returns void language sql security definer as $$
  update developments set enquiry_count = enquiry_count + 1 where id = dev_id;
$$;
