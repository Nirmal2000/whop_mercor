# Data Model – Job Listings Browser

## Entities Overview

- **IngestedListing**: Flattened snapshot of each Mercor listing stored in Supabase (`job_listings.listings`).
- **ListingEvent**: Raw tracking payload for user interactions (views, overlay opens, referral clicks).
- **ListingMetricsDaily**: Aggregated daily metrics per listing derived from `ListingEvent`.

## IngestedListing (`job_listings.listings`)

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `listing_id` | text | Mercor summary (`listingId`) | Primary key. |
| `title` | text | Mercor summary | Card headline and overlay. |
| `company_name` | text | Mercor summary/detail | Optional; fallback when `null`. |
| `status` | text | Mercor summary | Used to filter active listings. |
| `referral_amount` | numeric | Mercor summary/detail | Dollar value for referral pill. |
| `referral_link` | text | Mercor detail | CTA target; expected HTTPS. |
| `commitment` | text | Mercor summary | Normalized (hourly, contract, etc.). |
| `rate_min` | numeric | Mercor summary/detail | Lower bound of pay range. |
| `rate_max` | numeric | Mercor summary/detail | Upper bound of pay range. |
| `rate_range_display` | text | Computed | Matches JSONL `rateRangeDisplay`. |
| `pay_rate_frequency` | text | Mercor summary | Display context for pay. |
| `location` | text | Mercor summary | Display location; may be “Remote”. |
| `created_at` | timestamptz | Mercor summary | Primary sort descending. |
| `updated_at` | timestamptz | System | Timestamp of ingestion run. |
| `raw_payload` | jsonb | Mercor summary + detail | Entire flattened JSON record (including `detail_` prefixed fields and arrays). |

**Indexes & Constraints**
- Primary key on `listing_id`.
- GIN index on `raw_payload` for searching nested keys if needed.
- Partial index on `(status)` for active listings.
- RLS disabled (public read) with explicit grant to `anon`; write access restricted to service role ingest process.

## ListingEvent

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `id` | UUID | Generated | Primary key. |
| `listing_id` | UUID/string | FK → `JobListing.listing_id` | Required for all events. |
| `event_type` | enum (`card_view`, `overlay_open`, `referral_click`) | Application | Enumerated to match FR-009/FR-010 semantics. |
| `occurred_at` | timestamptz | Application | Server-generated timestamp (UTC). |
| `session_id` | uuid/string | Application | Optional identifier for deduplication; derived from Whop session when available. |
| `user_id` | string | Application | Optional; hashed Whop user ID for admin attribution with privacy guardrails. |
| `context` | jsonb | Application | Stores additional metadata (e.g., device type, page index). |

**Indexes & Constraints**
- Foreign key `listing_id` references `JobListing`.
- Index on `(listing_id, event_type, occurred_at)` for aggregation jobs.
- Optional index on `session_id` for deduplication queries.

## ListingMetricsDaily

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `listing_id` | UUID/string | Derived | FK → `JobListing`. |
| `metric_date` | date | Derived | Represents UTC day bucket. |
| `view_count` | integer | Derived | Count of `card_view` + `overlay_open` depending on aggregation rules. |
| `overlay_open_count` | integer | Derived | Count of `overlay_open`. |
| `referral_click_count` | integer | Derived | Count of `referral_click`. |
| `click_through_rate` | numeric | Derived | `referral_click_count / NULLIF(view_count, 0)`. |
| `last_aggregated_at` | timestamptz | Derived | Timestamp of last refresh for data freshness indicator. |

**Indexes & Constraints**
- Composite primary key `(listing_id, metric_date)`.
- Index on `metric_date` to support timeframe queries.
- Maintain check constraint ensuring counts are non-negative and CTR between 0 and 1.

## Relationships

- `IngestedListing` 1—* `ListingEvent`: each listing can have many tracking events.
- `IngestedListing` 1—* `ListingMetricsDaily`: each listing has up to one aggregate per day.
- `ListingEvent` aggregates feed `ListingMetricsDaily` via scheduled job or materialized view refresh.

## Validation & Business Rules

- Only listings with `status = 'active'` and `raw_payload ->> 'isPrivate' = 'false'` are surfaced in the public grid.
- Referrals require a valid HTTPS URL; validation occurs before insert/update.
- Tracking API validates `event_type` against enum and rejects unknown types.
- Aggregation job ignores events newer than 30 seconds to avoid race conditions, ensuring near-real-time but stable metrics.
- Admin dashboard queries restrict to 180-day range to keep responses performant.
- Ingestion truncates then bulk-inserts rows inside a transaction; failures roll back to preserve the prior dataset.
- JSONB payload retains all upstream keys, enabling forward compatibility when Mercor adds fields.
