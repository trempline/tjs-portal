create extension if not exists pgcrypto;

create table if not exists public.tjs_artist_requests (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.tjs_profiles(id) on delete cascade,
  event_domain_id integer references public.sys_event_domain(id) on delete set null,
  event_title text not null,
  teaser text,
  long_teaser text,
  description text,
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.tjs_artist_request_dates (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.tjs_artist_requests(id) on delete cascade,
  request_type text not null check (request_type in ('day_show', 'period')),
  start_date date not null,
  end_date date,
  event_time text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.tjs_artist_request_media (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.tjs_artist_requests(id) on delete cascade,
  media_type text not null check (media_type in ('CD', 'Video')),
  image_url text,
  name text not null,
  description text,
  url text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.tjs_artist_request_artists (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.tjs_artist_requests(id) on delete cascade,
  artist_id uuid references public.tjs_artists(id) on delete set null,
  invited_artist_id uuid references public.tjs_artists(id) on delete set null,
  invited_email text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.tjs_artist_request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.tjs_artist_requests(id) on delete cascade,
  author_profile_id uuid not null references public.tjs_profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.tjs_artist_requests enable row level security;
alter table public.tjs_artist_request_dates enable row level security;
alter table public.tjs_artist_request_media enable row level security;
alter table public.tjs_artist_request_artists enable row level security;
alter table public.tjs_artist_request_comments enable row level security;

drop policy if exists "artist requests select own" on public.tjs_artist_requests;
create policy "artist requests select own"
on public.tjs_artist_requests
for select
to authenticated
using (created_by = auth.uid());

drop policy if exists "artist requests insert own" on public.tjs_artist_requests;
create policy "artist requests insert own"
on public.tjs_artist_requests
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "artist requests update own" on public.tjs_artist_requests;
create policy "artist requests update own"
on public.tjs_artist_requests
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "artist request dates own access" on public.tjs_artist_request_dates;
create policy "artist request dates own access"
on public.tjs_artist_request_dates
for all
to authenticated
using (
  exists (
    select 1
    from public.tjs_artist_requests r
    where r.id = request_id
      and r.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.tjs_artist_requests r
    where r.id = request_id
      and r.created_by = auth.uid()
  )
);

drop policy if exists "artist request media own access" on public.tjs_artist_request_media;
create policy "artist request media own access"
on public.tjs_artist_request_media
for all
to authenticated
using (
  exists (
    select 1
    from public.tjs_artist_requests r
    where r.id = request_id
      and r.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.tjs_artist_requests r
    where r.id = request_id
      and r.created_by = auth.uid()
  )
);

drop policy if exists "artist request artists own access" on public.tjs_artist_request_artists;
create policy "artist request artists own access"
on public.tjs_artist_request_artists
for all
to authenticated
using (
  exists (
    select 1
    from public.tjs_artist_requests r
    where r.id = request_id
      and r.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.tjs_artist_requests r
    where r.id = request_id
      and r.created_by = auth.uid()
  )
);

drop policy if exists "artist request comments own access" on public.tjs_artist_request_comments;
create policy "artist request comments own access"
on public.tjs_artist_request_comments
for all
to authenticated
using (
  exists (
    select 1
    from public.tjs_artist_requests r
    where r.id = request_id
      and r.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.tjs_artist_requests r
    where r.id = request_id
      and r.created_by = auth.uid()
  )
);
