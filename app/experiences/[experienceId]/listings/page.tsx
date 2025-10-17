import { EmptyState } from "@/components/listings/EmptyState";
import { ListingBrowser } from "@/components/listings/ListingBrowser.client";
import {
  fetchListingsPage,
  type ListingSort
} from "@/lib/supabase/listings";
import { verifyExperienceAccess } from "@/lib/whop-auth";
import { AdminFooter } from "@/components/layout/AdminFooter";

const DEFAULT_PAGE_SIZE = Number(
  process.env.NEXT_PUBLIC_LISTINGS_PAGE_SIZE ?? "12"
);

interface ListingsPageProps {
  params: Promise<{ experienceId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

async function unwrapOptionalParams<T>(value: Promise<T> | T | undefined, fallback: T): Promise<T> {
  if (value instanceof Promise) {
    return await value;
  }
  return (value ?? fallback) as T;
}

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isNaN(parsed) ? 1 : Math.max(1, parsed);
}

function parseSort(value?: string): ListingSort {
  if (!value) return "recent";
  if (value === "pay_desc" || value === "pay_asc") return value;
  return "recent";
}

function parsePageSize(value?: string) {
  if (!value) return DEFAULT_PAGE_SIZE;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(parsed, 1), 50);
}

export default async function ListingsPage({
  params,
  searchParams
}: ListingsPageProps) {
  const resolvedParams = await unwrapOptionalParams(params, { experienceId: "" });
  const resolvedSearch = await unwrapOptionalParams(searchParams, {});

  await verifyExperienceAccess(resolvedParams.experienceId);

  const page = parsePage(getParamValue(resolvedSearch.page as string | undefined));
  const pageSize = parsePageSize(
    getParamValue(resolvedSearch.pageSize as string | undefined)
  );
  const sort = parseSort(getParamValue(resolvedSearch.sort as string | undefined));

  const result = await fetchListingsPage(
    page,
    pageSize,
    sort
  );
  const { data, totalItems, totalPages, page: resolvedPage } = result;
  const basePath = `/experiences/${resolvedParams.experienceId}/listings`;

  if (!data.length) {
    return (
      <EmptyState
        title="No listings available"
        message="We could not find any active roles right now. Check back soon or reach out to your Whop contact for the latest openings."
      />
    );
  }

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Featured roles</h1>
        
      </header>
      <ListingBrowser
        listings={data}
        experienceId={resolvedParams.experienceId}
        page={resolvedPage}
        totalPages={totalPages}
        sort={sort}
        basePath={basePath}
        hasExplicitPageParam={Boolean(resolvedSearch.page)}
      />
      <AdminFooter experienceId={resolvedParams.experienceId} />
    </section>
  );
}
