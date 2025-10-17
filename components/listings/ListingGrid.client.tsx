"use client";

import type { ListingSummary } from "@/lib/supabase/listings";
import { useEffect, useRef } from "react";
import { ListingCard } from "@/components/listings/ListingCard";

import type { ListingSort } from "@/lib/supabase/listings";

interface ListingGridProps {
  listings: ListingSummary[];
  experienceId: string;
  page: number;
  sort: ListingSort;
  onSelect?: (listing: ListingSummary, element: HTMLDivElement) => void;
  onReferralClick?: (listing: ListingSummary) => void;
}

export function ListingGrid({
  listings,
  experienceId,
  page,
  sort,
  onSelect,
  onReferralClick
}: ListingGridProps) {
  const trackedListings = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!listings.length) {
      return;
    }

    listings.forEach((listing) => {
      if (trackedListings.current.has(listing.listingId)) {
        return;
      }

      trackedListings.current.add(listing.listingId);

      fetch("/api/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.listingId,
          eventType: "card_view",
          experienceId,
          context: { page, sort }
        })
      }).catch((error) => {
        console.warn("Failed to record card view", error);
        trackedListings.current.delete(listing.listingId);
      });
    });
  }, [listings, experienceId, page, sort]);

  if (!listings.length) {
    return null;
  }

  return (
    <div
      className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
      data-testid="listing-grid"
    >
      {listings.map((listing) => (
        <ListingCard
          key={listing.listingId}
          listing={listing}
          onSelect={onSelect}
          onReferralClick={onReferralClick}
        />
      ))}
    </div>
  );
}
