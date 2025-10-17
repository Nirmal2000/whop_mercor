import type { DailyMetric } from "@/lib/analytics";

interface MetricsSummaryProps {
  metrics: DailyMetric[];
  totals: {
    viewCount: number;
    overlayOpenCount: number;
    referralClickCount: number;
  };
}

export function MetricsSummary({ metrics, totals }: MetricsSummaryProps) {
  return (
    <section className="space-y-6" data-testid="metrics-summary">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryStat label="Views" value={totals.viewCount} />
        <SummaryStat label="Overlay Opens" value={totals.overlayOpenCount} />
        <SummaryStat label="Referral Clicks" value={totals.referralClickCount} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Listing</th>
              <th className="px-4 py-3 text-left font-medium">Listing ID</th>
              <th className="px-4 py-3 text-left font-medium">Views</th>
              <th className="px-4 py-3 text-left font-medium">Overlay Opens</th>
              <th className="px-4 py-3 text-left font-medium">Referral Clicks</th>
              <th className="px-4 py-3 text-left font-medium">Click Through Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {metrics.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-white/50" colSpan={7}>
                  No metrics available for the selected range.
                </td>
              </tr>
            ) : (
              metrics.map((metric) => (
                <tr key={`${metric.listingId}-${metric.metricDate}`} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">
                    {metric.metricDate}
                  </td>
                  <td className="px-4 py-3 text-white/80">
                    {metric.listingName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-white/60 text-xs">
                    {metric.listingId}
                  </td>
                  <td className="px-4 py-3 text-white/80">{metric.viewCount}</td>
                  <td className="px-4 py-3 text-white/80">{metric.overlayOpenCount}</td>
                  <td className="px-4 py-3 text-white/80">{metric.referralClickCount}</td>
                  <td className="px-4 py-3 text-white/80">
                    {(metric.clickThroughRate * 100).toFixed(1)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
