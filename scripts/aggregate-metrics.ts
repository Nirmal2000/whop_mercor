import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import { computeDailyMetrics } from "@/lib/analytics";

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index >= 0) {
    return process.argv[index + 1];
  }
  return undefined;
}

function resolveDateRange(dateArg?: string) {
  const reference = dateArg === "today" || !dateArg ? new Date() : new Date(dateArg);
  if (Number.isNaN(reference.getTime())) {
    throw new Error(`Invalid date provided: ${dateArg}`);
  }
  const start = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  const { start, end } = resolveDateRange(getArg("--date"));
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  const { data, error } = await supabase
    .from("listing_events")
    .select("listing_id, event_type, occurred_at")
    .gte("occurred_at", start)
    .lt("occurred_at", end);

  if (error) {
    throw new Error(`Failed to load listing_events: ${error.message}`);
  }

  const metrics = computeDailyMetrics(data ?? []);
  if (!metrics.length) {
    console.info("No events found for the selected range. Nothing to aggregate.");
    return;
  }

  const upsertPayload = metrics.map((metric) => ({
    listing_id: metric.listingId,
    metric_date: metric.metricDate,
    view_count: metric.viewCount,
    overlay_open_count: metric.overlayOpenCount,
    referral_click_count: metric.referralClickCount,
    click_through_rate: metric.clickThroughRate,
    last_aggregated_at: new Date().toISOString()
  }));

  const upsert = await supabase
    .from("listing_metrics_daily")
    .upsert(upsertPayload, { onConflict: "listing_id,metric_date" });

  if (upsert.error) {
    throw new Error(`Failed to upsert metrics: ${upsert.error.message}`);
  }

  console.info(`Aggregated ${metrics.length} metric rows between ${start} and ${end}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
