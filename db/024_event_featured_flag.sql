alter table if exists public.tjs_events
  add column if not exists is_featured boolean not null default false;

create index if not exists idx_tjs_events_is_featured on public.tjs_events(is_featured);
