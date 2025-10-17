import { getServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

export type AnalyticsEventType =
  | "card_view"
  | "overlay_open"
  | "referral_click";

export interface ListingEventRow {
  listing_id: string;
  event_type: AnalyticsEventType;
  occurred_at: string;
}

export interface DailyMetric {
  listingId: string;
  metricDate: string;
  viewCount: number;
  overlayOpenCount: number;
  referralClickCount: number;
  clickThroughRate: number;
  listingName?: string | null;
}

export interface MetricFilters {
  startDate: string;
  endDate: string;
  listingId?: string;
}

interface Accumulator {
  listingId: string;
  metricDate: string;
  viewCount: number;
  overlayOpenCount: number;
  referralClickCount: number;
}

export function computeDailyMetrics(events: ListingEventRow[]): DailyMetric[] {
  const buckets = new Map<string, Accumulator>();

  events.forEach((event) => {
    const metricDate = event.occurred_at.slice(0, 10);
    const key = `${event.listing_id}|${metricDate}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        listingId: event.listing_id,
        metricDate,
        viewCount: 0,
        overlayOpenCount: 0,
        referralClickCount: 0
      };
      buckets.set(key, bucket);
    }

    switch (event.event_type) {
      case "card_view":
        bucket.viewCount += 1;
        break;
      case "overlay_open":
        bucket.overlayOpenCount += 1;
        bucket.viewCount += 1;
        break;
      case "referral_click":
        bucket.referralClickCount += 1;
        break;
      default:
        break;
    }
  });

  return Array.from(buckets.values()).map((bucket) => ({
    listingId: bucket.listingId,
    metricDate: bucket.metricDate,
    viewCount: bucket.viewCount,
    overlayOpenCount: bucket.overlayOpenCount,
    referralClickCount: bucket.referralClickCount,
    clickThroughRate:
      bucket.viewCount > 0
        ? bucket.referralClickCount / bucket.viewCount
        : 0
  }));
}

export async function fetchListingMetrics(
  filters: MetricFilters
): Promise<DailyMetric[]> {
  const supabase = getServiceRoleSupabaseClient();
  const startISO = `${filters.startDate}T00:00:00Z`;
  const endISO = `${filters.endDate}T23:59:59Z`;

  let query = supabase
    .schema("job_listings")
    .from("listing_events")
    .select("listing_id, event_type, occurred_at")
    .gte("occurred_at", startISO)
    .lte("occurred_at", endISO);

  if (filters.listingId) {
    query = query.eq("listing_id", filters.listingId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load listing metrics: ${error.message}`);
  }

  const metrics = computeDailyMetrics((data ?? []) as ListingEventRow[]);

  if (!metrics.length) {
    return metrics;
  }

  const listingIds = Array.from(new Set(metrics.map((metric) => metric.listingId)));
  const { data: listingRows, error: listingError } = await supabase
    .schema("job_listings")
    .from("listings")
    .select("listing_id, title")
    .in("listing_id", listingIds);

  const titleById = new Map<string, string | null>();
  if (!listingError && listingRows) {
    for (const row of listingRows) {
      titleById.set(row.listing_id, row.title ?? null);
    }
  }

  return metrics.map((metric) => ({
    ...metric,
    listingName: titleById.get(metric.listingId) ?? null
  }));
}
