"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  ListingDetail,
  ListingSort,
  ListingSummary
} from "@/lib/supabase/listings";
import { ListingGrid } from "@/components/listings/ListingGrid.client";
import { ListingOverlay } from "@/components/listings/ListingOverlay";
import { PaginationControls } from "@/components/listings/PaginationControls";

interface ListingBrowserProps {
  listings: ListingSummary[];
  experienceId: string;
  page: number;
  totalPages: number;
  sort: ListingSort;
  basePath: string;
  hasExplicitPageParam: boolean;
}

function buildReferralUrl(listingId: string): string | null {
  if (!listingId) {
    return null;
  }
  return `https://work.mercor.com/jobs/${listingId}?referralCode=b5b1c23c-b43c-4403-83c8-27e33c484fa9&utm_source=referral&utm_medium=share&utm_campaign=job_referral`;
}

export function ListingBrowser({
  listings,
  experienceId,
  page,
  totalPages,
  sort,
  basePath,
  hasExplicitPageParam
}: ListingBrowserProps) {
  const [activeListing, setActiveListing] = useState<ListingDetail | null>(null);
  const [hitError, setHitError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const scrollPosition = useRef<number>(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const storageKey = `listing-page:${experienceId}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(storageKey, String(page));
  }, [storageKey, page]);

  useEffect(() => {
    if (typeof window === "undefined" || hasExplicitPageParam) return;
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) return;
    const storedPage = Number.parseInt(stored, 10);
    if (!Number.isNaN(storedPage) && storedPage !== page) {
      const params = new URLSearchParams(searchParams?.toString());
      params.set("page", String(storedPage));
      router.replace(`${basePath}?${params.toString()}`, { scroll: false });
    }
  }, [hasExplicitPageParam, storageKey, page, router, basePath, searchParams]);

  const handleSelect = useCallback(
    async (summary: ListingSummary, element: HTMLDivElement) => {
      setHitError(null);
      setLoadingId(summary.listingId);
      lastFocusedElement.current = element;
      scrollPosition.current = window.scrollY;

      try {
        const response = await fetch(`/api/listings/${summary.listingId}`);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const detail = (await response.json()) as ListingDetail;
        setActiveListing(detail);
        fetch("/api/analytics/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: detail.listingId,
            eventType: "overlay_open",
            experienceId,
            context: { page, sort }
          })
        }).catch((error) => {
          console.warn("Failed to record overlay open", error);
        });
      } catch (error) {
        console.error("Failed to load listing detail", error);
        setHitError("We couldn't load the listing details. Try again in a moment.");
        setActiveListing(null);
      } finally {
        setLoadingId(null);
      }
    },
    [experienceId, page, sort]
  );

  const handleClose = useCallback(() => {
    setActiveListing(null);
    setHitError(null);
    window.scrollTo({ top: scrollPosition.current, behavior: "auto" });
    lastFocusedElement.current?.focus();
  }, []);

  const handleReferralClick = useCallback(
    (listing: ListingSummary | ListingDetail) => {
      const referralUrl = buildReferralUrl(listing.listingId);
      if (!referralUrl) {
        return;
      }

      fetch("/api/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.listingId,
          eventType: "referral_click",
          experienceId,
          context: { page, sort }
        })
      }).catch((error) => console.warn("Failed to record referral click", error));

      window.open(referralUrl, "_blank", "noreferrer");
    },
    [experienceId, page, sort]
  );

  return (
    <>
      <ListingGrid
        listings={listings}
        experienceId={experienceId}
        page={page}
        sort={sort}
        onSelect={handleSelect}
        onReferralClick={handleReferralClick}
      />
      <PaginationControls
        page={page}
        totalPages={totalPages}
        basePath={basePath}
      />
      {loadingId && !activeListing ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 text-white">
          Loading listing details…
        </div>
      ) : null}
      {hitError ? (
        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {hitError}
        </div>
      ) : null}
      {activeListing ? (
        <ListingOverlay
          listing={activeListing}
          onClose={handleClose}
          onReferralClick={handleReferralClick}
        />
      ) : null}
    </>
  );
}
