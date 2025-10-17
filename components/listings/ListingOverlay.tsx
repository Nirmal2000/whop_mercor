"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef } from "react";
import Markdown from "react-markdown";
import type { ListingDetail } from "@/lib/supabase/listings";

interface ListingOverlayProps {
  listing: ListingDetail;
  onClose: () => void;
  onReferralClick?: (listing: ListingDetail) => void;
}

export function ListingOverlay({ listing, onClose, onReferralClick }: ListingOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const referralUrl = useMemo(
    () => buildReferralUrl(listing),
    [listing.listingId, listing.referralLink]
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const content = (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" data-testid="listing-overlay">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-overlay-title"
        tabIndex={-1}
        className="flex h-full w-full max-w-xl flex-col gap-6 overflow-y-auto bg-black px-8 py-6 text-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="listing-overlay-title" className="text-3xl font-semibold">
              {listing.title}
            </h2>
            <p className="text-sm text-white/60">
              {listing.company ?? "Company undisclosed"} · {listing.location ?? "Remote"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/80 transition hover:border-white"
          >
            Close
          </button>
        </div>

        <section className="space-y-3 rounded-xl bg-white/5 p-4 text-sm text-white/80">
          <div className="flex flex-wrap items-center gap-3 text-white">
            {listing.payRate?.min || listing.payRate?.max ? (
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white/90">
                {formatPayRange(listing)}
              </span>
            ) : null}
            {listing.commitment ? (
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70">
                {listing.commitment}
              </span>
            ) : null}
            {listing.referralBoost?.active ? (
              <span className="rounded-full bg-whopPrimary/20 px-3 py-1 text-xs font-semibold text-whopPrimary-foreground">
                Referral boost active
              </span>
            ) : null}
          </div>
          <div className="text-xs text-white/60">
            {referralUrl ? (
              <button
                type="button"
                onClick={() => {
                  if (onReferralClick) {
                    onReferralClick(listing);
                  } else {
                    window.open(referralUrl, "_blank", "noreferrer");
                  }
                }}
                className="inline-flex items-center justify-center rounded-full bg-whopPrimary px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:shadow-lg"
                aria-label={`Open referral link for ${listing.title}`}
              >
                Open referral link
              </button>
            ) : (
              <span>Referral link not available.</span>
            )}
          </div>
        </section>

        <section className="space-y-3 text-white/80">
          {listing.description ? (
            <Markdown>
              {listing.description}
            </Markdown>
          ) : (
            <p>No additional description provided.</p>
          )}
        </section>

        <section className="space-y-2 text-sm text-white/70">
          {listing.metadata.hoursPerWeek ? (
            <p>Hours per week: {listing.metadata.hoursPerWeek}</p>
          ) : null}
          {listing.metadata.recentCandidatesCount ? (
            <p>Recent candidates: {listing.metadata.recentCandidatesCount}</p>
          ) : null}
        </section>

      </div>
    </div>
  );

  return createPortal(content, document.body);
}

function buildReferralUrl(listing: Pick<ListingDetail, "listingId" | "referralLink">): string | null {
  if (listing.referralLink) {
    return listing.referralLink;
  }
  if (!listing.listingId) {
    return null;
  }
  return `https://work.mercor.com/jobs/${listing.listingId}?referralCode=b5b1c23c-b43c-4403-83c8-27e33c484fa9&utm_source=referral&utm_medium=share&utm_campaign=job_referral`;
}

function formatPayRange(listing: ListingDetail) {
  const { min, max, frequency } = listing.payRate ?? {};
  if (!min && !max) return "Pay rate not shared";
  if (min && max && min !== max) {
    return `${formatCurrency(min)} – ${formatCurrency(max)} ${frequency ?? ""}`.trim();
  }
  const value = formatCurrency(min ?? max ?? 0);
  return `${value} ${frequency ?? ""}`.trim();
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount);
}
