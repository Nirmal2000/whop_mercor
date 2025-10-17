import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { verifyExperienceAccess } from "@/lib/whop-auth";

const ALLOWED_EVENT_TYPES = new Set([
  "card_view",
  "overlay_open",
  "referral_click"
]);

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_EVENTS = 120;
const requestBuckets = new Map<string, { count: number; reset: number }>();

function isRateLimited(identifier: string) {
  const now = Date.now();
  const entry = requestBuckets.get(identifier);
  if (!entry || entry.reset < now) {
    requestBuckets.set(identifier, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX_EVENTS) {
    return true;
  }
  entry.count += 1;
  return false;
}

interface EventPayload {
  listingId?: string;
  eventType?: string;
  occurredAt?: string;
  experienceId?: string;
  sessionId?: string;
  userId?: string;
  context?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  let payload: EventPayload;

  try {
    payload = (await request.json()) as EventPayload;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { listingId, eventType, occurredAt, experienceId, sessionId, context } =
    payload;

  const identifier =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    sessionId ??
    "unknown";

  if (isRateLimited(identifier)) {
    return NextResponse.json(
      { error: "Too many analytics events" },
      { status: 429 }
    );
  }

  if (!listingId || !eventType) {
    return NextResponse.json(
      { error: "listingId and eventType are required" },
      { status: 400 }
    );
  }

  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    return NextResponse.json(
      { error: `Unsupported eventType: ${eventType}` },
      { status: 400 }
    );
  }

  try {
    if (experienceId) {
      await verifyExperienceAccess(experienceId);
    }

    const supabase = getServiceRoleSupabaseClient();
    const { error } = await supabase
      .schema("job_listings")
      .from("listing_events")
      .insert({
        listing_id: listingId,
        event_type: eventType,
        occurred_at: occurredAt ?? new Date().toISOString(),
        session_id: sessionId ?? null,
        user_id: payload.userId ?? null,
      context: context ?? {}
    });

    if (error) {
      console.error("Failed to record listing event", error);
      return NextResponse.json(
        { error: "Unable to record event" },
        { status: 500 }
      );
    }

    console.info(
      "[analytics-event] accepted",
      JSON.stringify({
        listingId,
        eventType,
        experienceId,
        sessionId,
        identifier,
        context
      })
    );

    return NextResponse.json({ status: "accepted" }, { status: 202 });
  } catch (error) {
    console.error("Unexpected error recording event", error);
    return NextResponse.json(
      { error: "Unable to record event" },
      { status: 500 }
    );
  }
}
