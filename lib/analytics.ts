import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AnalyticsEventType =
  | "card_view"
  | "overlay_open"
  | "referral_click";

export interface ListingEventRow {
  listing_id: string;
  event_type: AnalyticsEventType;
  occurred_at: string;
}

export interface DailyMetricRow {
  listing_id: string;
  metric_date: string;
  view_count: number;
  overlay_open_count: number;
  referral_click_count: number;
  click_through_rate: number;
  last_aggregated_at: string;
}

export interface DailyMetric {
  listingId: string;
  metricDate: string;
  viewCount: number;
  overlayOpenCount: number;
  referralClickCount: number;
  clickThroughRate: number;
  lastAggregatedAt?: string;
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
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .schema("job_listings")
    .from("listing_metrics_daily")
    .select(
      "listing_id, metric_date, view_count, overlay_open_count, referral_click_count, click_through_rate, last_aggregated_at"
    )
    .gte("metric_date", filters.startDate)
    .lte("metric_date", filters.endDate)
    .order("metric_date", { ascending: false });

  if (filters.listingId) {
    query = query.eq("listing_id", filters.listingId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load listing metrics: ${error.message}`);
  }

  return (data ?? []).map((row: DailyMetricRow) => ({
    listingId: row.listing_id,
    metricDate: row.metric_date,
    viewCount: row.view_count,
    overlayOpenCount: row.overlay_open_count,
    referralClickCount: row.referral_click_count,
    clickThroughRate: row.click_through_rate,
    lastAggregatedAt: row.last_aggregated_at
  }));
}
