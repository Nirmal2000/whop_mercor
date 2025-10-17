import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ListingSort = "recent" | "pay_desc" | "pay_asc";

export interface ListingSummary {
  listingId: string;
  title: string;
  company?: string | null;
  location?: string | null;
  referralAmount?: number | null;
  commitment?: string | null;
  payRate?: {
    min?: number | null;
    max?: number | null;
    frequency?: string | null;
  };
  referralLinkAvailable: boolean;
  referralLink?: string | null;
  createdAt: string;
  rawPayload?: Record<string, unknown> | null;
}

export interface ListingDetail extends ListingSummary {
  description?: string | null;
  metadata: {
    status?: string | null;
    hoursPerWeek?: number | null;
    team?: string | null;
    recentCandidatesCount?: number | null;
  };
  referralBoost?: {
    active: boolean;
    expiresAt?: string | null;
  } | null;
}

interface PaginatedListings {
  data: ListingSummary[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE_DEFAULT = 12;

const SELECT_FIELDS = `listing_id, title, company_name, location, referral_amount, commitment, rate_min, rate_max, pay_rate_frequency, referral_link, status, is_private, created_at, rate_range_display, detail_description, raw_payload`;
const DETAIL_FIELDS = SELECT_FIELDS;

function toSummary(row: any): ListingSummary {
  return {
    listingId: row.listing_id,
    title: row.title,
    company: row.company_name,
    location: row.location,
    referralAmount: row.referral_amount,
    commitment: row.commitment,
    payRate: {
      min: row.rate_min,
      max: row.rate_max,
      frequency: row.pay_rate_frequency
    },
    referralLinkAvailable: Boolean(row.referral_link),
    referralLink: row.referral_link ?? null,
    createdAt: row.created_at,
    rawPayload: row.raw_payload ?? null
  };
}

function toDetail(row: any): ListingDetail {
  const payload = (row.raw_payload ?? {}) as Record<string, unknown>;
  const hours = payload.detail_hoursPerWeek ?? payload.hoursPerWeek;
  const team = payload.detail_team ?? payload.team;
  const recent = payload.recentCandidatesCount ?? payload.recentWeekCandidateCount;
  const boostFlag = Boolean(payload.detail_referralBoost ?? payload.referralBoost);
  const boostExpiry =
    (payload.detail_referralBoostExpiryAt ??
      payload.referralBoostExpiryAt ??
      null) as string | null;
  return {
    ...toSummary(row),
    description:
      row.detail_description ??
      (payload.detail_description as string | undefined) ??
      (payload.description as string | undefined) ??
      null,
    metadata: {
      status: row.status,
      hoursPerWeek:
        typeof hours === "number"
          ? hours
          : typeof hours === "string"
            ? Number(hours) || null
            : null,
      team: typeof team === "string" ? team : null,
      recentCandidatesCount:
        typeof recent === "number"
          ? recent
          : typeof recent === "string"
            ? Number(recent) || null
            : null
    },
    referralBoost: boostFlag
      ? {
          active: true,
          expiresAt: boostExpiry
        }
      : null
  };
}

function applySort(query: any, sort?: ListingSort) {
  switch (sort) {
    case "pay_desc":
      return query.order("rate_max", { ascending: false, nullsLast: true });
    case "pay_asc":
      return query.order("rate_min", { ascending: true, nullsLast: true });
    default:
      return query.order("created_at", { ascending: false });
  }
}

export async function fetchListingsPage(
  page = 1,
  pageSize = PAGE_SIZE_DEFAULT,
  sort: ListingSort = "recent"
): Promise<PaginatedListings> {
  const supabase = await createServerSupabaseClient();
  const fromIndex = (page - 1) * pageSize;
  const toIndex = fromIndex + pageSize - 1;

  let query = supabase
    .schema("job_listings")
    .from("listings")
    .select(`${SELECT_FIELDS}`, { count: "exact" })
    .eq("status", "active")
    .eq("is_private", false);

  query = applySort(query, sort);

  const { data, count, error } = await query.range(fromIndex, toIndex);

  if (error) {
    throw new Error(`Failed to load listings: ${error.message}`);
  }

  const totalItems = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    data: (data ?? []).map(toSummary),
    totalItems,
    totalPages,
    page,
    pageSize
  };
}

export async function fetchListingById(
  listingId: string
): Promise<ListingDetail | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .schema("job_listings")
    .from("listings")
    .select(DETAIL_FIELDS)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load listing: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  if (data.is_private || data.status !== "active") {
    return null;
  }

  return toDetail(data);
}
