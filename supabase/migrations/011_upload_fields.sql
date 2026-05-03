alter table developments
  add column if not exists hero_alt_text      text,
  add column if not exists feature_image_url  text,
  add column if not exists agent_logo_1       text,
  add column if not exists agent_logo_2       text;
