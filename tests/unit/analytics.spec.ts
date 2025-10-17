import { computeDailyMetrics } from "@/lib/analytics";

describe("computeDailyMetrics", () => {
  const baseDate = "2025-10-01T12:00:00Z";

  it("aggregates views, overlay opens, and referral clicks per listing per day", () => {
    const result = computeDailyMetrics([
      { listing_id: "listing-1", event_type: "card_view", occurred_at: baseDate },
      { listing_id: "listing-1", event_type: "card_view", occurred_at: baseDate },
      { listing_id: "listing-1", event_type: "overlay_open", occurred_at: baseDate },
      { listing_id: "listing-1", event_type: "referral_click", occurred_at: baseDate },
      { listing_id: "listing-2", event_type: "card_view", occurred_at: baseDate }
    ]);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          listingId: "listing-1",
          metricDate: "2025-10-01",
          viewCount: 3,
          overlayOpenCount: 1,
          referralClickCount: 1,
          clickThroughRate: 1 / 3
        }),
        expect.objectContaining({
          listingId: "listing-2",
          metricDate: "2025-10-01",
          viewCount: 1,
          overlayOpenCount: 0,
          referralClickCount: 0,
          clickThroughRate: 0
        })
      ])
    );
  });

  it("handles days with zero views gracefully", () => {
    const result = computeDailyMetrics([
      { listing_id: "listing-3", event_type: "referral_click", occurred_at: baseDate }
    ]);

    expect(result).toEqual([
      expect.objectContaining({
        listingId: "listing-3",
        metricDate: "2025-10-01",
        viewCount: 0,
        referralClickCount: 1,
        clickThroughRate: 0
      })
    ]);
  });
});
