import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { requireWhopCompanyAdmin } from "@/lib/whop-auth";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { runListingsSync } from "@/lib/ingestion/sync-listings";

interface IngestionStatusBody {
  jobId: string;
  status: "queued" | "running" | "succeeded" | "failed";
  startedAt: string;
  finishedAt?: string;
  message?: string;
  recordsWritten?: number;
}

export async function POST(_request: NextRequest) {
  try {
    await requireWhopCompanyAdmin();
  } catch (error) {
    return NextResponse.json(
      { error: "Admin privileges required" },
      { status: 403 }
    );
  }

  const supabase = getServiceRoleSupabaseClient();
  const acquire = await supabase.rpc("try_lock_job_listings_refresh");

  if (acquire.error) {
    console.error("[ingestion] Failed to acquire refresh lock", acquire.error);
    return NextResponse.json(
      { error: "Unable to start refresh" },
      { status: 500 }
    );
  }

  if (!acquire.data) {
    return NextResponse.json(
      { error: "Refresh already in progress" },
      { status: 409 }
    );
  }

  const jobId = randomUUID();
  const startedAt = new Date().toISOString();

  try {
    const result = await runListingsSync({ logger: console });
    const body: IngestionStatusBody = {
      jobId,
      status: "succeeded",
      startedAt,
      finishedAt: result.finishedAt,
      recordsWritten: result.recordsWritten
    };

    return NextResponse.json(body, { status: 202 });
  } catch (error) {
    console.error("[ingestion] Refresh failed", error);
    const body: IngestionStatusBody = {
      jobId,
      status: "failed",
      startedAt,
      finishedAt: new Date().toISOString(),
      message: error instanceof Error ? error.message : "Unknown error"
    };

    return NextResponse.json(body, { status: 500 });
  } finally {
    await supabase.rpc("unlock_job_listings_refresh");
  }
}
