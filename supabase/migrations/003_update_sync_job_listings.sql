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

    truncate job_listings.listings;

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
