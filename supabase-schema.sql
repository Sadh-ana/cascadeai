-- Run this in Supabase → SQL Editor

create table if not exists rescues (
  id          uuid primary key default gen_random_uuid(),
  analysis    jsonb,
  plan        jsonb,
  meals       int     default 0,
  co2_kg      numeric default 0,
  families    int     default 0,
  status      text    default 'completed',
  approved_at timestamptz,
  created_at  timestamptz default now()
);

-- Enable Row Level Security but allow all for demo
alter table rescues enable row level security;

create policy "Allow all for demo"
  on rescues for all
  using (true)
  with check (true);