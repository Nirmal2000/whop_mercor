# Analytics Dashboard Operations

## Overview

The admin dashboard at `/dashboard/[companyId]/listings` surfaces daily aggregated metrics for job listings:

- **Views**: Card impressions and overlay opens
- **Overlay Opens**: Detail sidecar activations
- **Referral Clicks**: Outbound referral actions
- **Click Through Rate**: `referral_clicks / views`

Access is restricted to Whop company admins via `requireWhopCompanyAdmin()`.

## Required Environment Variables

Ensure the following variables are configured in `.env.local` and deployment secrets:

- `WHOP_API_KEY`, `WHOP_AGENT_USER_ID`, `WHOP_COMPANY_ID`, `NEXT_PUBLIC_WHOP_APP_ID`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Seeding Local Data

```bash
pnpm ts-node scripts/seed-listings.ts --file docs/listings.jsonl
```

## Aggregating Metrics

Run the daily aggregate script locally:

```bash
pnpm aggregate:metrics --date today
```

To backfill a specific day:

```bash
pnpm aggregate:metrics --date 2025-10-01
```

### Scheduling in Supabase

1. Deploy `scripts/aggregate-metrics.ts` as a Supabase Edge Function or scheduled TypeScript script.
2. Create a cron schedule (e.g., hourly) invoking the script with `--date today`.
3. Confirm successful runs by inspecting the `listing_metrics_daily` table and the dashboard totals.

## Dashboard Usage

- Filters accept ISO date ranges and an optional listing ID.
- Pagination state persists per experience via session storage; deep-linking uses the `page` query parameter.
- Metrics table renders most recent day first; totals summarize the current filtered range.

## Troubleshooting

- **403 Access**: Verify the requesting user has company admin rights in Whop.
- **Empty Metrics**: Ensure `listing_events` contains data and the aggregation job has executed for the date range.
- **Rate Limits**: Analytics event endpoint enforces per-minute limits; monitor structured logs for `Too many analytics events` warnings.
