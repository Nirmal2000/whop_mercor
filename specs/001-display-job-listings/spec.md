# Feature Specification: Job Listings Browser

**Feature Branch**: `001-display-job-listings`  
**Created**: 2025-10-17  
**Status**: Draft  
**Input**: User description: "we are going to build a simple app that just displays job listings in boxes. the listings are a sql db. in the card view show some relevant deets like name, pay, referral link. clicking on it will open a sidecar overlay from right with all deets. need pagination support for mobile too. update spec to also include a dasboard to display stats like visits and clicks. add dat atracking. must be accessed only by admin. below is python code for fetching mercor listings ... create Supabase job_listings schema/table, ingest flattened JSONL payload, allow anon access, and add admin button to refresh data with full replace."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Job Listings (Priority: P1)

A job seeker visits the job board and browses available roles presented as cards with headline information.

**Why this priority**: Viewing the list of available roles is the primary value proposition—without it the feature delivers no benefit.

**Independent Test**: Can be fully tested by loading the job board with sample listings and confirming users can scan the card layout for key details without opening additional views.

**Acceptance Scenarios**:

1. **Given** published job listings exist, **When** a job seeker opens the job board, **Then** they see a paginated set of job cards showing role title, compensation summary, company (if available), and a referral action indicator.
2. **Given** the job board is loaded, **When** a listing lacks a specific data point (e.g., pay not available), **Then** the card gracefully indicates the field is unavailable without breaking the layout.

---

### User Story 2 - Review Full Job Detail (Priority: P2)

A job seeker selects a role to review comprehensive information inside a sidecar overlay.

**Why this priority**: Users need deeper detail before deciding to act on a job; the overlay enables this without losing their place in the listing.

**Independent Test**: Can be tested by selecting any card and verifying the overlay displays complete information, with clear navigation back to the card list.

**Acceptance Scenarios**:

1. **Given** the card list is visible, **When** a job seeker clicks or taps a card, **Then** a sidecar overlay slides in from the right containing the full job description, requirements, pay details, referral link, and metadata (e.g., location, team).
2. **Given** the sidecar overlay is open, **When** the user chooses to close it (via close control or tapping outside on desktop/mobile), **Then** the overlay closes and the user returns to the same scroll position in the card list.

---

### User Story 3 - Monitor Listing Performance (Priority: P3)

An admin reviews engagement metrics to understand how job seekers interact with listings and referral links.

**Why this priority**: Business stakeholders need visibility into performance to optimize listings and referral incentives.

**Independent Test**: Tested by logging in with admin credentials, loading the analytics dashboard, and confirming accurate stats and access controls.

**Acceptance Scenarios**:

1. **Given** the admin has authenticated, **When** they open the analytics dashboard, **Then** they see aggregated metrics for listing visits and referral clicks across selectable timeframes.
2. **Given** a non-admin attempts to access the dashboard URL, **When** authorization is evaluated, **Then** access is denied with a clear explanation and no metrics exposed.

---

### User Story 4 - Navigate Listings Efficiently (Priority: P4)

A job seeker pages through more roles when the initial set does not contain a match.

**Why this priority**: Pagination ensures access to the entire catalog while keeping initial load times fast.

**Independent Test**: Tested by moving between pages and validating list state (current page, total count) updates without errors.

**Acceptance Scenarios**:

1. **Given** more listings exist beyond the first page, **When** the job seeker uses pagination controls (next/previous or page numbers), **Then** the next set of cards loads with updated indicators for current page and total listings.
2. **Given** a user changes page, **When** they refresh or revisit the board in the same session, **Then** the previously selected page persists or defaults back according to defined behavior noted in assumptions.

---

### User Story 5 - Refresh Listings Dataset (Priority: P5)

An admin synchronizes the Supabase listings table with the latest Mercor data using the ingestion pipeline.

**Why this priority**: The public experience depends on fresh, accurate listings, and operations teams need a self-service way to refresh content without engineering support.

**Independent Test**: Trigger the refresh job from the admin dashboard, verify the Supabase table truncates and repopulates from the API, and confirm the public UI reflects updated records.

**Acceptance Scenarios**:

1. **Given** the admin is viewing the analytics dashboard, **When** they click “Refresh Listings,” **Then** the system queues the ingestion task, displays progress, and prevents a second run until completion.
2. **Given** the ingestion job succeeds, **When** anonymous clients request listings, **Then** the `job_listings.listings` table serves records that match the flattened JSONL schema including `detail_` prefixes and computed fields.
3. **Given** the API fetch fails or partial data is returned, **When** the job reports an error, **Then** the previous dataset remains intact, the admin sees a descriptive failure message, and diagnostics are logged for remediation.

---

### Edge Cases

- What happens when no job listings match the filter or page? Display an empty-state message with guidance to adjust search or check back later.
- How does system handle referral links that are missing or invalid? Show a disabled referral action with contextual messaging instead of a broken link.
- What occurs if the overlay content exceeds the viewport height? Enable internal scrolling within the overlay while keeping close controls accessible.
- What happens when analytics data is delayed or temporarily unavailable? Display a fallback state on the dashboard explaining data freshness and when to retry.
- How does the system respond to unauthorized dashboard access attempts? Provide a secure access-denied message without revealing sensitive details.
- How does the system behave when the ingestion job is already running? Disable the refresh button, surface “in progress” status, and queue or reject additional triggers to avoid race conditions.
- What happens if the Mercor API returns unexpected fields or types? Persist the entire payload as JSON while best-effort casting known fields; log schema drift for investigation.
- How is read availability maintained during refresh? Serve cached data until the transaction completes, then atomically swap to the new dataset.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST retrieve active job listings from the authoritative relational data source and surface only records marked as publishable.
- **FR-002**: System MUST present job listings as cards that include, at minimum, role title, compensation summary, company or team name, and a referral call-to-action.
- **FR-003**: System MUST gracefully handle missing or optional fields (e.g., pay not provided) by displaying a clear placeholder or label without breaking layout.
- **FR-004**: System MUST open a sidecar overlay from the right when a card is selected, displaying the full job description, responsibilities, qualifications, pay details, posting metadata, and the referral link.
- **FR-005**: System MUST allow users to open the referral link from both the card and the sidecar overlay, tracking the action for analytics.
- **FR-006**: System MUST provide pagination controls that let users move forward and backward through result pages and indicate the current page and total available pages.
- **FR-007**: System MUST load subsequent pages without duplicating entries already shown and maintain scroll position when returning from the overlay.
- **FR-008**: System MUST render the card list and overlay responsively on mobile viewports, ensuring tap targets are touch-friendly and overlay interactions remain accessible.
- **FR-009**: System MUST record listing visits, including timestamp and listing identifier, whenever a user views a card or opens the overlay.
- **FR-010**: System MUST aggregate visit and referral click metrics into daily summaries that feed the analytics dashboard.
- **FR-011**: System MUST provide an analytics dashboard that surfaces key metrics (e.g., visits, referral clicks, click-through rate) over configurable time ranges.
- **FR-012**: System MUST restrict analytics dashboard access to authenticated admin users and log access attempts (successful and denied) for auditing.
- **FR-013**: System MUST create and maintain a Supabase schema `job_listings` with a `listings` table that stores all flattened listing data, replacing all rows during each refresh.
- **FR-014**: The ingestion pipeline MUST fetch summaries and details via the Mercor APIs, handle conflict resolution as defined (`detail_` prefix), and persist both typed columns (e.g., title, status, referralAmount, createdAt) and the raw JSON payload for future processing.
- **FR-015**: Supabase anonymous clients MUST have read access to `job_listings.listings`, while write access is restricted to the server-side ingestion job (service role or Edge Function).
- **FR-016**: The admin dashboard MUST expose a guarded control to trigger ingestion, prevent concurrent executions, display real-time status (idle, running, completed, failed), and log outcomes.

### Key Entities *(include if feature involves data)*

- **Job Listing**: Represents a single role available for referral; includes identifiers, title, compensation summary, referral URL, location, team, description, and publication status.
- **Ingested Listing Record**: Flattened Supabase representation combining Mercor summary and detail data with conflict-prefixed fields, typed columns, and a JSONB payload.
- **Pagination State**: Captures the current page index, total results, and page size used to retrieve subsequent listing batches; maintained per session to restore user progress.
- **Engagement Metric**: Stores aggregated counts of listing visits, referral clicks, and derived rates grouped by listing and timeframe for dashboard visualization.

### Assumptions

- Initial release targets a single catalog with no user-specific filtering beyond pagination.
- Referral links are provided as fully qualified URLs stored with each listing.
- Session persistence for pagination uses standard browser storage; cross-device continuity is out of scope.
- Admin users authenticate through existing internal identity management; defining new admin enrollment flows is out of scope.
- Analytics data freshness targets near-real-time (sub-hour) updates; historical backfilling beyond 90 days is not required for MVP.
- Mercor API schema remains broadly consistent; unexpected keys are stored in JSONB and surfaced for review rather than breaking ingestion.
- Ingestion executes within a trusted server environment (Edge Function or server action) that can use the Supabase service role key; clients never call Mercor APIs directly.
- Full-table replacement is acceptable for current use cases; no point-in-time history is required beyond the latest snapshot.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: During usability testing, 90% of job seekers can identify a suitable listing and open its details within 30 seconds of landing on the board.
- **SC-002**: Pagination interactions return the next set of listings within 2 seconds for 95% of requests under expected traffic.
- **SC-003**: Mobile usability testing shows 90% of participants can open and close the sidecar overlay without accidental dismissals.
- **SC-004**: At least 75% of sessions that open the sidecar overlay also trigger the referral action at least once, indicating the detail view supports conversion.
- **SC-005**: Admin feedback indicates 95% confidence that dashboard metrics for visits and referral clicks match underlying raw data sampled over a 7-day period.
- **SC-006**: Unauthorized access attempts to the analytics dashboard result in zero data exposure incidents during security testing and monitoring.
- **SC-007**: Ingestion job completes within 5 minutes for the full dataset and results in 0 partial writes, verified by matching record counts between Supabase and the source JSONL file.
- **SC-008**: Newly ingested listings appear to anonymous users within 1 minute of job completion, demonstrating successful cache invalidation and public read access.
