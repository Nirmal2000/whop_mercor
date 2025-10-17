-- Create schema for job listings snapshot
create schema if not exists job_listings;

-- Create listings table with typed columns and raw payload
create table if not exists job_listings.listings (
    listing_id text primary key,
    title text,
    company_name text,
    status text,
    referral_amount numeric,
    referral_link text,
    commitment text,
    rate_min numeric,
    rate_max numeric,
    rate_range_display text,
    pay_rate_frequency text,
    location text,
    detail_description text,
    is_private boolean not null default false,
    created_at timestamptz,
    updated_at timestamptz not null default timezone('utc', now()),
    raw_payload jsonb not null
);

-- Helpful indexes for filtering and search
create index if not exists listings_status_idx
    on job_listings.listings (status)
    where status is not null;

create index if not exists listings_visibility_idx
    on job_listings.listings (is_private);

create index if not exists listings_raw_payload_idx
    on job_listings.listings using gin (raw_payload);

-- Grant read access to anonymous and authenticated roles
grant usage on schema job_listings to anon, authenticated;
grant select on all tables in schema job_listings to anon, authenticated;

-- Ensure future tables inherit read grants
alter default privileges in schema job_listings
    grant select on tables to anon, authenticated;

-- Grant full access to service role for ingestion
grant usage on schema job_listings to service_role;
grant all privileges on all tables in schema job_listings to service_role;

alter default privileges in schema job_listings
    grant all on tables to service_role;

-- Function to synchronise listings inside a transaction
create or replace function public.sync_job_listings(records jsonb)
returns void
language plpgsql
security definer
set search_path = public, job_listings
as $$
declare
    item jsonb;
begin
    if records is null then
        raise exception 'records payload required';
    end if;

    if jsonb_typeof(records) <> 'array' then
        raise exception 'records must be a JSON array';
    end if;

    delete from job_listings.listings;

    insert into job_listings.listings (
        listing_id,
        title,
        company_name,
        status,
        referral_amount,
        referral_link,
        commitment,
        rate_min,
        rate_max,
        rate_range_display,
        pay_rate_frequency,
        location,
        detail_description,
        is_private,
        created_at,
        updated_at,
        raw_payload
    )
    select
        (item->>'listingId')::text as listing_id,
        item->>'title' as title,
        item->>'companyName' as company_name,
        item->>'status' as status,
        nullif(item->>'referralAmount', '')::numeric as referral_amount,
        item->>'referralLink' as referral_link,
        item->>'commitment' as commitment,
        nullif(item->>'rateMin', '')::numeric as rate_min,
        nullif(item->>'rateMax', '')::numeric as rate_max,
        item->>'rateRangeDisplay' as rate_range_display,
        item->>'payRateFrequency' as pay_rate_frequency,
        item->>'location' as location,
        coalesce(item->>'detail_description', item->>'description') as detail_description,
        coalesce((item->>'isPrivate')::boolean, false) as is_private,
        coalesce(nullif(item->>'createdAt', '')::timestamptz, timezone('utc', now())) as created_at,
        timezone('utc', now()) as updated_at,
        item as raw_payload
    from jsonb_array_elements(records) as item
    where item ? 'listingId';
end;
$$;

grant execute on function public.sync_job_listings(jsonb) to service_role;

-- Advisory lock helpers to prevent concurrent refreshes
create or replace function public.try_lock_job_listings_refresh()
returns boolean
language sql
security definer
as $$
    select pg_try_advisory_lock(78451234);
$$;

create or replace function public.unlock_job_listings_refresh()
returns boolean
language sql
security definer
as $$
    select pg_advisory_unlock(78451234);
$$;

grant execute on function public.try_lock_job_listings_refresh() to service_role;
grant execute on function public.unlock_job_listings_refresh() to service_role;
