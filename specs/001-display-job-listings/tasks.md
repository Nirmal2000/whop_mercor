# Tasks: Job Listings Browser

**Input**: Design documents from `/specs/001-display-job-listings/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the Next.js + Tailwind project scaffold and folder layout from the implementation plan.

- [X] T001 Initialize Next.js 14 App Router project with TypeScript configuration in `package.json` and `tsconfig.json`.
- [X] T002 [P] Configure Tailwind CSS v3 content paths and base styles in `tailwind.config.js` and `styles/tailwind.css`.
- [X] T003 [P] Create directory scaffold per plan (`app/experiences/[experienceId]/listings`, `app/dashboard/[companyId]/listings`, `components/`, `lib/`, `scripts/`, `tests/`) with placeholder `.keep` files.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required before user stories, including environment management, auth, data access, and testing harness.

- [X] T004 Document required environment variables in `.env.example` based on `docs/WHOP_BOILERPLATE.md` and quickstart guidance.
- [X] T005 [P] Implement Supabase client and server helpers in `lib/supabase/client.ts` and `lib/supabase/server.ts`.
- [X] T006 [P] Create Whop authentication utilities with admin helper in `lib/whop-auth.ts`.
- [X] T007 [P] Add shared shell layout wiring Tailwind globals in `components/layout/Shell.tsx` and `app/layout.tsx`.
- [X] T008 [P] Define analytics tables (`listing_events`, `listing_metrics_daily`) in `supabase/migrations/*_analytics.sql`.
- [X] T009 Generate listings seed script that ingests `docs/listings.jsonl` in `scripts/seed-listings.ts`.
- [X] T010 [P] Configure Jest and Playwright runners with base specs in `package.json`, `jest.config.js`, and `playwright.config.ts`.

**Checkpoint**: Authentication, database access, and tooling are ready—user story implementation can begin.

---

## Phase 3: User Story 1 – Browse Job Listings (Priority: P1) 🎯 MVP

**Goal**: Job seekers see a responsive grid of active listings with headline details and empty-state handling.

**Independent Test**: Visit `/experiences/[experienceId]/listings` and verify cards render with title, pay, company, referral indicator, and graceful fallbacks when data is missing.

- [X] T011 [P] [US1] Author Playwright smoke test for listing grid visibility in `tests/e2e/listings.spec.ts`.
- [X] T012 [P] [US1] Implement listing summary query helpers in `lib/supabase/listings.ts`.
- [X] T013 [US1] Expose paginated listings API at `app/api/listings/route.ts` returning summaries and pagination metadata.
- [X] T014 [P] [US1] Build card presentation component with fallback field handling in `components/listings/ListingCard.tsx`.
- [X] T015 [P] [US1] Create shared empty/skeleton views in `components/listings/EmptyState.tsx` and hook loading UI in `app/experiences/[experienceId]/listings/loading.tsx`.
- [X] T016 [US1] Compose server page fetching listings and rendering responsive grid in `app/experiences/[experienceId]/listings/page.tsx`.
- [X] T017 [US1] Implement analytics event endpoint for listing views in `app/api/analytics/events/route.ts` (accepts `card_view`).
- [X] T018 [US1] Add client-side impression tracker posting `card_view` events in `components/listings/ListingGrid.client.tsx` and integrate with page.

**Checkpoint**: Listing grid renders with analytics for impressions—MVP ready.

---

## Phase 4: User Story 2 – Review Full Job Detail (Priority: P2)

**Goal**: Job seekers open a sidecar overlay with complete listing information while maintaining list scroll position.

**Independent Test**: From the listings page select a card; a right-side overlay appears with full description, referral link, and close controls that return to the same scroll location.

- [X] T019 [P] [US2] Add Playwright flow covering overlay open/close behavior in `tests/e2e/listings-overlay.spec.ts`.
- [X] T020 [P] [US2] Extend detail query helper for single listings in `lib/supabase/listings.ts`.
- [X] T021 [US2] Provide listing detail API at `app/api/listings/[listingId]/route.ts` exposing full description metadata.
- [X] T022 [P] [US2] Implement accessible overlay UI component in `components/listings/ListingOverlay.tsx`.
- [X] T023 [US2] Create interactive browser controller managing selection and overlay state in `components/listings/ListingBrowser.client.tsx`.
- [X] T024 [US2] Wire overlay controller into the listings page to preserve scroll and restore focus in `app/experiences/[experienceId]/listings/page.tsx`.
- [X] T025 [US2] Instrument overlay open analytics (`overlay_open`) within `components/listings/ListingBrowser.client.tsx` and allow event type in `app/api/analytics/events/route.ts`.
- [X] T026 [US2] Add referral CTA actions on cards and overlay with accessible buttons in `components/listings/ListingCard.tsx` and `components/listings/ListingOverlay.tsx`.

**Checkpoint**: Detail overlay delivers complete information with analytics on engagement.

---

## Phase 5: User Story 3 – Monitor Listing Performance (Priority: P3)

**Goal**: Admins access a dashboard summarizing listing visits and referral clicks from aggregated analytics.

**Independent Test**: An admin navigates to `/dashboard/[companyId]/listings`, sees metrics for visits/clicks with selectable range; a non-admin receives a 403 denial.

- [X] T027 [P] [US3] Add Playwright admin access scenario verifying 403 for non-admins in `tests/e2e/admin-dashboard.spec.ts`.
- [X] T028 [P] [US3] Write Jest unit test for aggregation helpers in `tests/unit/analytics.spec.ts`.
- [X] T029 [US3] Implement metrics aggregation script producing daily rollups in `scripts/aggregate-metrics.ts`.
- [X] T030 [US3] Build analytics query utilities reading aggregates in `lib/analytics.ts`.
- [X] T031 [US3] Create admin analytics summary endpoint with Whop admin guard in `app/api/admin/analytics/summary/route.ts`.
- [X] T032 [P] [US3] Build reusable metrics visualization component in `components/analytics/MetricsSummary.tsx`.
- [X] T033 [US3] Implement admin dashboard page layout combining metrics and filters in `app/dashboard/[companyId]/listings/page.tsx`.
- [X] T034 [US3] Enhance Whop auth helper to log denied attempts and expose admin-only error handling in `lib/whop-auth.ts`.

**Checkpoint**: Admin dashboard operates securely with validated metrics.

---

## Phase 6: User Story 4 – Navigate Listings Efficiently (Priority: P4)

**Goal**: Users paginate through listings, maintain state, and see accurate analytics context.

**Independent Test**: Changing page updates cards, reflects current/total indicators, persists selection on reload, and analytics events include page context.

- [X] T035 [P] [US4] Add Playwright pagination coverage in `tests/e2e/listings-pagination.spec.ts`.
- [X] T036 [P] [US4] Extend listings query helper for pagination inputs/outputs in `lib/supabase/listings.ts`.
- [X] T037 [US4] Update listings API to accept page parameters and return pagination metadata in `app/api/listings/route.ts`.
- [X] T038 [P] [US4] Build pagination controls component with responsive layout in `components/listings/PaginationControls.tsx`.
- [X] T039 [US4] Persist pagination state via search params/session storage in `components/listings/ListingBrowser.client.tsx` and `app/experiences/[experienceId]/listings/page.tsx`.
- [X] T040 [US4] Attach page context to analytics payloads for views/overlay events in `components/listings/ListingGrid.client.tsx` and `components/listings/ListingBrowser.client.tsx`.

**Checkpoint**: Listings navigation is efficient, stateful, and measured.

---

## Phase 7: User Story 5 – Refresh Listings Dataset (Priority: P5)

**Goal**: Admins trigger a full Mercor listings sync that replaces Supabase data and updates the UI without downtime.

**Independent Test**: Initiate refresh from the admin dashboard, observe Supabase job table truncate/repopulate atomically, and confirm refreshed listings render publicly.

- [X] T044 [US5] Create Supabase migration for `job_listings` schema, `listings` table, indexes, and grants in `supabase/migrations/002_create_job_listings_schema.sql`.
- [X] T045 [P] [US5] Implement Mercor HTTP client and flattening logic in `lib/ingestion/mercor-client.ts`.
- [X] T046 [US5] Build transactional sync routine that truncates then upserts records in `lib/ingestion/sync-listings.ts`.
- [X] T047 [US5] Expose admin-only refresh API at `app/api/admin/listings/refresh/route.ts` with concurrency lock and status responses.
- [X] T048 [P] [US5] Add “Refresh Listings” control with progress states to `app/dashboard/[companyId]/listings/page.tsx`.
- [X] T049 [US5] Provide CLI/Edge trigger script in `scripts/refresh-listings.ts` and document usage in `docs/analytics-dashboard.md`.
- [X] T050 [P] [US5] Write Jest integration test for sync routine (`tests/unit/ingestion.spec.ts`) and Playwright flow for admin-triggered refresh (`tests/e2e/ingestion-refresh.spec.ts`).

**Checkpoint**: Admin refresh fully replaces Supabase dataset, exposes status, and keeps public UI in sync.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, documentation, and operational readiness.

- [X] T041 [P] Add rate limiting and structured logging to analytics event handler in `app/api/analytics/events/route.ts`.
- [X] T042 [P] Document analytics dashboard usage and cron setup in `docs/analytics-dashboard.md`.
- [X] T043 Update `package.json` scripts to include `seed:listings`, `aggregate:metrics`, and CI test commands.

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2**: Setup must precede foundational infrastructure.
- **Phase 2 → User Stories**: All user stories depend on foundational utilities, migrations, and tooling.
- **User Story Ordering**: Recommended sequence US1 → US2 → US3 → US4 (priority order). US3 depends on analytics events from US1/US2; US4 enhances existing flows but can start once US1 data pipeline exists.
- **Polish Phase**: Runs after desired user stories are complete.

### Parallel Opportunities

- Tasks marked `[P]` within a phase touch different files and can proceed concurrently (e.g., T002 with T003, T012 with T014, T020 with T022).
- Different user stories can be staffed in parallel **after** Phase 2, provided shared files (e.g., `lib/supabase/listings.ts`) coordinate via sequencing.
- Testing tasks (e.g., Playwright specs) can run alongside implementation as they reference separate files.

---

## Implementation Strategy

- **MVP Focus**: Complete Phases 1–3 to deliver the browsing experience with analytics capture for card views.
- **Incremental Delivery**: Layer US2 for overlay details, US3 for analytics insight, US4 for advanced navigation, then US5 for ingestion and refresh controls.
- **Operational Readiness**: Finish with Phase 8 to harden observability and document ongoing operations (cron jobs, ingestion scripts).

---

## Task Metrics

- **Total Tasks**: 50
- **Per User Story**: US1 (8), US2 (8), US3 (8), US4 (6), US5 (7) — remaining 13 cover setup, foundational, and polish.
- **Parallel Opportunities Identified**: 21 tasks flagged `[P]`.
- **Independent Test Criteria**:
  - US1: Listings render with fallback data states.
  - US2: Overlay displays full details without losing scroll position.
  - US3: Admin-only dashboard surfaces accurate metrics; non-admin blocked.
  - US4: Pagination preserves state and analytics include context.
  - US5: Refresh replaces Supabase dataset atomically and exposes status to admins.
- **Suggested MVP Scope**: Complete through Phase 3 (User Story 1) plus foundational infrastructure.
