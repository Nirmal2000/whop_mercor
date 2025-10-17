# Research Findings – Job Listings Browser

## Decision 1: Rendering & Data Fetching Strategy
- **Decision**: Use Next.js 14 App Router with server components/pages to load listings via Supabase server SDK, supplementing with client components only for interactive UI (overlay, pagination controls).
- **Rationale**: Server components keep data fetching on the server, reduce bundle size, and allow leveraging Supabase service role securely for SQL access. Interactive pieces (sidecar overlay state, pagination triggers) can be isolated to client components, keeping the overall experience fast.
- **Alternatives considered**:
  - Fully client-side data fetching with `useEffect`: rejected due to exposing API keys, slower initial render, and poorer SEO/accessibility.
  - Next.js pages router: rejected because App Router supports streaming and co-location, already standard for new Whop apps.

## Decision 2: Listing Analytics Tracking
- **Decision**: Capture raw tracking events (listing view, overlay open, referral click) via a signed-in `POST /api/analytics/events` endpoint that writes to a `listing_events` table; materialize daily aggregates into a `listing_metrics_daily` table via Supabase cron job or SQL view with scheduled refresh.
- **Rationale**: Keeping raw events enables auditing and future metrics; daily aggregates satisfy the dashboard requirement with performant SQL queries. Supabase scheduled functions (cron) are a lightweight way to roll up counts without introducing extra infrastructure.
- **Alternatives considered**:
  - Tracking directly in the browser with third-party analytics: rejected because the dashboard requires first-party metrics aligned with referral clicks.
  - Storing only aggregated counters: rejected because it blocks future drill-downs and makes corrections impossible.

## Decision 3: Admin Access Enforcement
- **Decision**: Gate the analytics dashboard and metrics API using Whop's `verifyUser` helper with an `admin` level check, falling back to a 403 response and logging denied attempts.
- **Rationale**: The Whop boilerplate already provides verified access tied to experiences/companies; reusing it ensures consistency and keeps access logic server-side.
- **Alternatives considered**:
  - Custom role table within Supabase: rejected to avoid duplicating Whop permissions and credentialing flows.
  - Client-side gating only: rejected because it is insecure and violates the admin-only requirement.

## Decision 4: UI Composition & Styling
- **Decision**: Build the listing grid and overlay with Tailwind CSS v3 utility classes, using responsive grid columns (1 column on mobile, 2-3 on desktop) and a headless pattern for the overlay (e.g., `Dialog`-style semantics) with focus trapping.
- **Rationale**: Tailwind is mandated; utility-first styling speeds up iteration and ensures consistent responsive behavior. Accessibility can be handled with ARIA roles and focus management on the overlay.
- **Alternatives considered**:
  - Component libraries (e.g., Chakra, MUI): rejected to avoid additional dependencies and design drift from Whop patterns.
  - Custom CSS modules: rejected because Tailwind already satisfies the styling constraint with lower setup.

## Decision 5: Local Development Data
- **Decision**: Provide a seed script that reads `docs/listings.jsonl` to populate Supabase (or a local SQLite fallback) for local development, with feature flags/default props to fall back to static JSON when database connectivity is unavailable.
- **Rationale**: Ensures developers can iterate without live DB access while matching production schema; JSONL already matches Supabase format.
- **Alternatives considered**:
  - Mocking data inline in components: rejected because it diverges from production structure.
  - Requiring live Supabase connection only: rejected to keep onboarding simple and resilient to network restrictions.

## Decision 6: Listings Ingestion Pipeline
- **Decision**: Implement a server-side ingestion job (Supabase Edge Function or Next.js route handler) that mirrors the provided Python logic: fetch listing summaries and detail payloads from Mercor, flatten them with `detail_` conflict prefixes, and upsert into the `job_listings.listings` table within a transaction that truncates then repopulates data.
- **Rationale**: Running ingestion server-side keeps API keys secret, ensures consistent data shape, and allows atomic replacement so the public UI never sees partial updates. Leveraging JSONB storage plus typed columns balances flexibility with performant querying.
- **Alternatives considered**:
  - Executing ingestion client-side from the admin browser: rejected due to credential exposure and unreliable networking.
  - Incremental diff-based updates: rejected for MVP because Mercor APIs offer full snapshots and replace-all simplifies conflict resolution.
