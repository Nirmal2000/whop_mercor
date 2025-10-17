import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  fetchListingsPage,
  type ListingSort
} from "@/lib/supabase/listings";

function parseIntParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : Math.max(1, parsed);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseIntParam(searchParams.get("page"), 1);
  const pageSize = Math.min(parseIntParam(searchParams.get("pageSize"), 12), 50);
  const sort = (searchParams.get("sort") ?? "recent") as ListingSort;

  try {
    const result = await fetchListingsPage(page, pageSize, sort);
    return NextResponse.json({
      data: result.data,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        totalItems: result.totalItems
      }
    });
  } catch (error) {
    console.error("Failed to fetch listings", error);
    return NextResponse.json(
      { error: "Unable to fetch listings" },
      { status: 500 }
    );
  }
}
