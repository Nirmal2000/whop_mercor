import { getServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import {
  fetchAndFlattenListings,
  type FetchAndFlattenOptions,
  type FlattenedListing
} from "@/lib/ingestion/mercor-client";

export interface SyncOptions extends FetchAndFlattenOptions {
  dryRun?: boolean;
  logger?: Pick<typeof console, "info" | "warn" | "error">;
}

export interface SyncResult {
  recordsWritten: number;
  startedAt: string;
  finishedAt: string;
}

export async function runListingsSync(
  options: SyncOptions = {}
): Promise<SyncResult> {
  const logger = options.logger ?? console;
  const startedAt = new Date();

  logger.info("[ingestion] Fetching Mercor listings...");
  const listings = await fetchAndFlattenListings(options);
  logger.info(`[ingestion] Retrieved ${listings.length} records from Mercor.`);

  if (options.dryRun) {
    logger.info("[ingestion] Dry run – skipping database write.");
    const finishedAt = new Date();
    return {
      recordsWritten: listings.length,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString()
    };
  }

  if (!listings.length) {
    throw new Error("Mercor API returned zero listings; aborting refresh.");
  }

  const supabase = getServiceRoleSupabaseClient();
  const payload = listings.map((listing) => sanitizePayload(listing));

  logger.info("[ingestion] Writing listings snapshot to Supabase...");
  const { error } = await supabase.rpc("sync_job_listings", {
    records: payload
  });

  if (error) {
    logger.error("[ingestion] Supabase sync_job_listings error", error);
    throw new Error(`Failed to sync listings: ${error.message ?? error}`);
  }

  const finishedAt = new Date();
  logger.info("[ingestion] Listings snapshot updated successfully.");

  return {
    recordsWritten: payload.length,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString()
  };
}

function sanitizePayload(listing: FlattenedListing): Record<string, unknown> {
  // Ensure payload is JSON serialisable and convert undefined to null to keep Postgres happy.
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(listing)) {
    clean[key] = value === undefined ? null : value;
  }
  return clean;
}
