-- Run this in your Supabase SQL editor (project > SQL Editor)

-- 1. Posts table
create table if not exists posts (
  id          uuid primary key default gen_random_uuid(),
  site        text not null,
  title       text not null default '',
  slug        text not null default '',
  excerpt     text not null default '',
  content     text not null default '',
  cover_image text not null default '',
  images      text[] not null default '{}',
  category    text not null default '',
  author      text not null default 'Redacción',
  read_time   text not null default '5 min',
  status      text not null default 'draft' check (status in ('draft','published')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Index for filtering by site
create index if not exists posts_site_idx on posts (site);
create index if not exists posts_status_idx on posts (status);
create index if not exists posts_created_at_idx on posts (created_at desc);

-- 3. Row Level Security — allow all from anon (secured by middleware password)
alter table posts enable row level security;
create policy "Allow all" on posts for all using (true) with check (true);

-- 4. Storage bucket for images
-- Run in Supabase Dashboard > Storage > New bucket:
--   Name: post-images
--   Public: YES
-- Or via SQL:
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict do nothing;

create policy "Public read post-images"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Anon upload post-images"
  on storage.objects for insert
  with check (bucket_id = 'post-images');

create policy "Anon delete post-images"
  on storage.objects for delete
  using (bucket_id = 'post-images');
