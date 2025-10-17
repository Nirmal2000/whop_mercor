import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchListingMetrics } from "@/lib/analytics";
import { requireWhopCompanyAdmin } from "@/lib/whop-auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const listingId = searchParams.get("listingId") ?? undefined;

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 400 }
    );
  }

  try {
    const userId = await requireWhopCompanyAdmin();
    const metrics = await fetchListingMetrics({ startDate, endDate, listingId });

    const totals = metrics.reduce(
      (acc, metric) => {
        acc.viewCount += metric.viewCount;
        acc.overlayOpenCount += metric.overlayOpenCount;
        acc.referralClickCount += metric.referralClickCount;
        return acc;
      },
      { viewCount: 0, overlayOpenCount: 0, referralClickCount: 0 }
    );

    return NextResponse.json({
      data: metrics,
      generatedAt: new Date().toISOString(),
      requestedBy: userId,
      totals
    });
  } catch (error) {
    console.error("Failed to fetch admin analytics", error);
    return NextResponse.json(
      { error: "Admin permissions required or analytics unavailable" },
      { status: 403 }
    );
  }
}
