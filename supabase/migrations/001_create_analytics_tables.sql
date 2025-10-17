do $$
begin
  if not exists (
    select 1 from pg_type
    where typnamespace = 'job_listings'::regnamespace
      and typname = 'listing_event_type'
  ) then
    create type job_listings.listing_event_type as enum ('card_view', 'overlay_open', 'referral_click');
  end if;
end
$$;

create table if not exists job_listings.listing_events (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null,
  event_type job_listings.listing_event_type not null,
  occurred_at timestamptz not null default timezone('utc', now()),
  session_id text,
  user_id text,
  context jsonb not null default '{}'::jsonb,
  inserted_at timestamptz not null default timezone('utc', now())
);

create index if not exists listing_events_listing_event_idx
  on job_listings.listing_events (listing_id, event_type, occurred_at desc);

create index if not exists listing_events_session_idx
  on job_listings.listing_events (session_id)
  where session_id is not null;

create table if not exists job_listings.listing_metrics_daily (
  listing_id text not null,
  metric_date date not null,
  view_count integer not null default 0 check (view_count >= 0),
  overlay_open_count integer not null default 0 check (overlay_open_count >= 0),
  referral_click_count integer not null default 0 check (referral_click_count >= 0),
  click_through_rate numeric(6,4) not null default 0,
  last_aggregated_at timestamptz not null default timezone('utc', now()),
  primary key (listing_id, metric_date),
  check (click_through_rate between 0 and 1)
);

create index if not exists listing_metrics_daily_metric_date_idx
  on job_listings.listing_metrics_daily (metric_date desc);

grant usage on schema job_listings to anon, authenticated;
grant select on job_listings.listing_events to anon, authenticated;
grant select on job_listings.listing_metrics_daily to anon, authenticated;
grant insert on job_listings.listing_events to service_role;
grant usage on schema job_listings to service_role;
grant all privileges on job_listings.listing_metrics_daily to service_role;

alter default privileges in schema job_listings
    grant select on tables to anon, authenticated;

alter default privileges in schema job_listings
    grant all on tables to service_role;
