create or replace function public.sync_job_listings(records jsonb)
returns void
language plpgsql
security definer
set search_path = public, job_listings
as $$
declare
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
        (payload->>'listingId')::text as listing_id,
        payload->>'title' as title,
        payload->>'companyName' as company_name,
        payload->>'status' as status,
        nullif(payload->>'referralAmount', '')::numeric as referral_amount,
        payload->>'referralLink' as referral_link,
        payload->>'commitment' as commitment,
        nullif(payload->>'rateMin', '')::numeric as rate_min,
        nullif(payload->>'rateMax', '')::numeric as rate_max,
        payload->>'rateRangeDisplay' as rate_range_display,
        payload->>'payRateFrequency' as pay_rate_frequency,
        payload->>'location' as location,
        coalesce(payload->>'detail_description', payload->>'description') as detail_description,
        coalesce((payload->>'isPrivate')::boolean, false) as is_private,
        coalesce(nullif(payload->>'createdAt', '')::timestamptz, timezone('utc', now())) as created_at,
        timezone('utc', now()) as updated_at,
        payload as raw_payload
    from jsonb_array_elements(records) as entries(payload)
    where payload ? 'listingId';
end;
$$;

grant execute on function public.sync_job_listings(jsonb) to service_role;
