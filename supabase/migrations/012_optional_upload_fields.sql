alter table developments
  add column if not exists floor_plan_upload_url  text,
  add column if not exists additional_video_url   text,
  add column if not exists price_list_url         text,
  add column if not exists specifications_url     text;
