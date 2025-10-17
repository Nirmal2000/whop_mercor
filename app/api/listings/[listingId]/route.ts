import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchListingById } from "@/lib/supabase/listings";

interface RouteContext {
  params: {
    listingId: string;
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { listingId } = context.params;

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
