import { MetricsSummary } from "@/components/analytics/MetricsSummary";
import { RefreshListingsButton } from "@/components/analytics/RefreshListingsButton";
import { fetchListingMetrics } from "@/lib/analytics";
import { requireWhopCompanyAdmin } from "@/lib/whop-auth";

const DEFAULT_RANGE_DAYS = 30;

interface AdminListingsPageProps {
  params: Promise<{ companyId: string }> | { companyId: string };
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}

async function unwrapOptional<T>(value: Promise<T> | T | undefined, fallback: T): Promise<T> {
  if (value instanceof Promise) {
    return value;
  }
  return (value ?? fallback) as T;
}

function resolveSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function defaultStartDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - DEFAULT_RANGE_DAYS);
  return date.toISOString().slice(0, 10);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AdminListingsPage({
  params,
  searchParams
}: AdminListingsPageProps) {
  const resolvedParams = await unwrapOptional(params, { companyId: "" });
  const resolvedSearch = await unwrapOptional(searchParams, {});

  await requireWhopCompanyAdmin();

  const startDate = resolveSearchParam(resolvedSearch.startDate) ?? defaultStartDate();
  const endDate = resolveSearchParam(resolvedSearch.endDate) ?? todayDate();
  const listingId = resolveSearchParam(resolvedSearch.listingId);

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

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">
            Listing performance – company {resolvedParams.companyId}
          </h1>
          <p className="text-white/60">
            Review traffic and referral conversions over time. Adjust the filters to zoom into specific listing IDs or date ranges.
          </p>
        </div>
        <RefreshListingsButton />
      </header>

      <form className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 md:grid-cols-4" method="get">
        <div className="flex flex-col gap-2">
          <label htmlFor="startDate" className="text-xs uppercase text-white/60">
            Start date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={startDate}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-whopPrimary focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="endDate" className="text-xs uppercase text-white/60">
            End date
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={endDate}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-whopPrimary focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="listingId" className="text-xs uppercase text-white/60">
            Listing ID (optional)
          </label>
          <input
            id="listingId"
            name="listingId"
            type="text"
            placeholder="listing_A123..."
            defaultValue={listingId ?? ""}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-whopPrimary focus:outline-none"
          />
        </div>
        <div className="md:col-span-4">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-whopPrimary px-4 py-2 text-sm font-semibold text-white transition hover:shadow-card"
          >
            Apply filters
          </button>
        </div>
      </form>

      <MetricsSummary metrics={metrics} totals={totals} />
    </section>
  );
}
