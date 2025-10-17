import { flattenListing } from "@/lib/ingestion/mercor-client";

describe("flattenListing", () => {
  it("prefixes conflicting detail keys and computes rate range display", () => {
    const summary = {
      listingId: "list_123",
      rateMin: 25,
      rateMax: 30,
      title: "Summary Title",
      status: "active"
    };

    const detail = {
      rateMin: 28,
      rateMax: 35,
      description: "Detail description"
    };

    const flattened = flattenListing(summary, detail);

    expect(flattened.listingId).toBe("list_123");
    expect(flattened.detail_rateMin).toBe(28);
    expect(flattened.detail_rateMax).toBe(35);
    expect(flattened.rateMin).toBe(25);
    expect(flattened.rateRangeDisplay).toBe("25 - 30");
    expect(flattened.detail_description).toBe("Detail description");
  });

  it("throws when listingId is missing", () => {
    expect(() => flattenListing({}, {})).toThrow();
  });
});
