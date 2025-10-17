# Implementation Plan: Job Listings Browser

**Branch**: `001-display-job-listings` | **Date**: 2025-10-17 | **Spec**: [Job Listings Browser](./spec.md)  
**Input**: Feature specification from `/specs/001-display-job-listings/spec.md`

## Summary

Deliver a Whop-embedded Next.js 14 experience that renders job listings from Supabase in card form with a Tailwind-powered responsive overlay, records first-party listing engagement, exposes an admin-only analytics dashboard summarizing visits and referral clicks, and provides an ingestion workflow that fetches Mercor listings, replaces the Supabase `job_listings.listings` table, and can be triggered from the admin UI—all aligned with Whop’s dynamic routing patterns (`app/experiences/[experienceId]` and `app/dashboard/[companyId]`).

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18 (Next.js 14 App Router)  
**Primary Dependencies**: Next.js 14, Tailwind CSS ^3, @whop/api & @whop/react, Supabase JavaScript client, React Query, Mercor ingestion client (node fetch or Edge runtime)  
**Storage**: Supabase Postgres (`job_listings` schema for listings snapshot + analytics tables) with JSONL seed loader for local development  
**Testing**: Jest + React Testing Library for unit/UI, Playwright for end-to-end flows, Supabase SQL fixtures for data validation, ingestion integration tests with mocked Mercor endpoints  
**Target Platform**: Whop embedded web app (desktop + mobile responsive)  
**Project Type**: Web single-project (Next.js app in repository root)  
**Performance Goals**: Listing grid render <2s (95th percentile), pagination response <2s, overlay open/close <500ms, analytics dashboard queries <1s for 90-day windows, ingestion completes under 5 minutes  
**Constraints**: Tailwind-only styling, admin analytics must be server-gated with Whop auth, tracking cannot expose PII, compatible with Whop iframe environment, ingestion must tolerate Mercor API limits and partial failures  
**Scale/Scope**: Hundreds of concurrent listings, aggregates for up to 180 days of analytics, limited admin user base (<50 users), full dataset refreshes multiple times per day

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **G1 – Constitution Availability**: `.specify/memory/constitution.md` lacks concrete directives; treat as no additional mandates but monitor for future updates. **PASS**
- **G2 – Test Discipline**: Plan includes Jest + Playwright coverage for primary stories; aligns with spec success metrics. **PASS**
- **G3 – Security & Access Control**: Admin dashboard and analytics APIs routed through Whop server-side verification ensure admin-only access. **PASS**

## Project Structure

### Documentation (this feature)

```
specs/001-display-job-listings/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.openapi.yaml
└── tasks.md              # Created during /speckit.tasks (not part of this command)
```

### Source Code (repository root)

```
app/
├── dashboard/
│   └── [companyId]/
│       └── listings/page.tsx
├── experiences/
│   └── [experienceId]/
│       └── listings/
│           ├── page.tsx
│           ├── loading.tsx
│           └── layout.tsx
├── components/
│   ├── listings/
│   │   ├── ListingCard.tsx
│   │   ├── ListingOverlay.tsx
│   │   └── PaginationControls.tsx
│   ├── analytics/
│   │   └── MetricsSummary.tsx
│   └── layout/
│       └── Shell.tsx
├── api/
│   ├── listings/route.ts
│   ├── listings/[listingId]/route.ts
│   ├── analytics/
│   │   └── events/route.ts
│   └── admin/
│       ├── analytics/summary/route.ts
│       └── listings/refresh/route.ts
lib/
├── supabase/
│   ├── server.ts
│   └── client.ts
├── ingestion/
│   ├── mercor-client.ts
│   └── sync-listings.ts
├── analytics.ts
└── whop-auth.ts
styles/
├── globals.css
└── tailwind.css
scripts/
├── seed-listings.ts
├── aggregate-metrics.ts
└── refresh-listings.ts
tests/
├── unit/
│   ├── listings.spec.tsx
│   ├── analytics.spec.ts
│   └── ingestion.spec.ts
└── e2e/
    ├── listings.spec.ts
    ├── admin-dashboard.spec.ts
    └── ingestion-refresh.spec.ts
```

**Structure Decision**: Maintain a single Next.js project rooted at `/app`, respecting Whop’s dynamic segment conventions: public experience views under `app/experiences/[experienceId]/…` and admin tooling under `app/dashboard/[companyId]/…`. Shared utilities live in `lib/`, reusable UI components live under `components/`, and operational scripts (seed, aggregate, refresh) live in `scripts/`. Ingestion-specific logic is isolated under `lib/ingestion/`, and tests remain grouped by runner under `tests/` with additional coverage for refresh workflows.

## Complexity Tracking

*No constitution violations identified; table intentionally left blank.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
