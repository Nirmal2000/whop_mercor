# Quickstart – Job Listings Browser

## Prerequisites

- Node.js 18.18+ (Next.js 14 requirement)
- pnpm 8+
- Supabase project (or local Supabase CLI) seeded with listings schema
- Whop app credentials (see `docs/WHOP_BOILERPLATE.md`)

## 1. Install & Bootstrap

```bash
pnpm install
pnpm dlx tailwindcss init -p # if Tailwind config not yet generated
```

Ensure `tailwind.config.js` includes `./app/**/*.{ts,tsx}`, `./components/**/*.{ts,tsx}`, and `./lib/**/*.{ts,tsx}` in the `content` array.

## 2. Environment Variables

Create `.env.local` with Whop and Supabase credentials:

```
WHOP_API_KEY=...
WHOP_WEBHOOK_SECRET=...
WHOP_AGENT_USER_ID=...
NEXT_PUBLIC_WHOP_APP_ID=...
WHOP_COMPANY_ID=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Use service-role key only on the server (never expose to client components).

## 3. Database Setup

1. Run Supabase migrations (SQL in `/supabase/migrations` once generated) to create analytics tables and the `job_listings` schema.
2. Seed local data using the provided script:

   ```bash
   pnpm ts-node scripts/seed-listings.ts --file docs/listings.jsonl
   ```

   The script upserts listings into the `job_listings.listings` table and truncates analytics tables for a clean state.

3. (Optional) Configure a Supabase scheduled function/cron to execute `scripts/aggregate-metrics.ts` hourly for daily rollups, or run manually for local testing:

   ```bash
   pnpm ts-node scripts/aggregate-metrics.ts --date today
   ```

4. To emulate the admin refresh workflow locally, run:

   ```bash
   pnpm ts-node scripts/refresh-listings.ts
   ```

   This truncates and repopulates `job_listings.listings` using live Mercor API data (requires network access and credentials).

## 4. Run the App

```bash
pnpm dev
```

- Public listings UI: http://localhost:3000/experiences/[experienceId]/listings
- Admin analytics dashboard & refresh: http://localhost:3000/dashboard/[companyId]/listings (requires Whop admin session)

## 5. Testing

```bash
pnpm test           # Jest unit/integration
pnpm exec playwright test  # E2E scenarios
```

CI should execute both commands. Add Playwright config to use Supabase test schema or reset seeds before runs.

## 6. Analytics Tracking Verification

1. Load the listings page and interact with cards/overlay.
2. Check `listing_events` table for new rows (`event_type` values: `card_view`, `overlay_open`, `referral_click`).
3. Run aggregation script or wait for cron, then review `listing_metrics_daily` for updated counts.
4. Confirm metrics surface in the admin dashboard and align with raw event totals.

## 7. Deployment Notes

- Ensure Supabase service role key is set in hosting provider as a server-only secret.
- Configure cron or scheduled Edge Functions for both analytics aggregation and Mercor ingestion (refresh) if automated syncs are desired.
- Harden `/api/analytics/events` with rate limiting (baked into handler) and monitor structured logs for anomalies.
- Review Supabase Row Level Security (disabled for `job_listings.listings`) to confirm anonymous read access and restricted write access via service role.
