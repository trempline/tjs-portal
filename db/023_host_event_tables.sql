create extension if not exists pgcrypto;

create table if not exists public.tjs_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type text not null check (event_type in ('REQUEST', 'EVENT_INSTANCE')),
  status text not null check (status in ('IN_EDITION', 'AVAILABLE', 'SELECTED', 'PENDING', 'APPROVED', 'CANCELLED', 'COMPLETED')),
  is_featured boolean not null default false,
  origin_website text not null check (origin_website in ('TJS', 'PAG', 'HOST_SITE')),
  visibility_scope text[] not null default array['TJS']::text[],
  parent_event_id uuid,
  created_by uuid,
  proposed_dates date[],
  department text,
  city text,
  source text check (source in ('TJS', 'PAG', 'HOST_SITE')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_tjs_events_parent_event_id on public.tjs_events(parent_event_id);
create index if not exists idx_tjs_events_event_type on public.tjs_events(event_type);
create index if not exists idx_tjs_events_status on public.tjs_events(status);
create index if not exists idx_tjs_events_is_featured on public.tjs_events(is_featured);

create table if not exists public.tjs_event_hosts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.tjs_events(id) on delete cascade,
  host_id integer not null references public.tjs_hosts(id) on delete cascade,
  selected_dates date[],
  location_id uuid references public.tjs_locations(id) on delete set null,
  host_status text not null default 'PENDING' check (host_status in ('PENDING', 'CONFIRMED', 'CANCELLED')),
  selected_at timestamptz not null default timezone('utc'::text, now()),
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (event_id, host_id)
);

create index if not exists idx_tjs_event_hosts_event_id on public.tjs_event_hosts(event_id);
create index if not exists idx_tjs_event_hosts_host_id on public.tjs_event_hosts(host_id);
create index if not exists idx_tjs_event_hosts_status on public.tjs_event_hosts(host_status);

create table if not exists public.tjs_event_artists (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.tjs_events(id) on delete cascade,
  artist_id uuid not null references public.tjs_artists(id) on delete cascade,
  role text not null default 'PRIMARY' check (role in ('PRIMARY', 'INVITED', 'ACCOMPANIST', 'SUPPORT')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (event_id, artist_id, role)
);

create index if not exists idx_tjs_event_artists_event_id on public.tjs_event_artists(event_id);
create index if not exists idx_tjs_event_artists_artist_id on public.tjs_event_artists(artist_id);

alter table public.tjs_events enable row level security;
alter table public.tjs_event_hosts enable row level security;
alter table public.tjs_event_artists enable row level security;

drop policy if exists "tjs events authenticated access" on public.tjs_events;
create policy "tjs events authenticated access"
on public.tjs_events
for all
to authenticated
using (true)
with check (true);

drop policy if exists "tjs event hosts authenticated access" on public.tjs_event_hosts;
create policy "tjs event hosts authenticated access"
on public.tjs_event_hosts
for all
to authenticated
using (true)
with check (true);

drop policy if exists "tjs event artists authenticated access" on public.tjs_event_artists;
create policy "tjs event artists authenticated access"
on public.tjs_event_artists
for all
to authenticated
using (true)
with check (true);
