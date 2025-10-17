import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchListingById } from "@/lib/supabase/listings";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;

  try {
    const listing = await fetchListingById(listingId);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error(`Failed to fetch listing detail for ${listingId}`, error);
    return NextResponse.json(
      { error: "Unable to fetch listing detail" },
      { status: 500 }
    );
  }
}
