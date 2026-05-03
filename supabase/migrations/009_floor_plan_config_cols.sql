alter table development_floor_plans
  add column if not exists beds   int,
  add column if not exists bath   int,
  add column if not exists garage int;
