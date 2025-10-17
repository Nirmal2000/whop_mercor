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
  const descriptionParagraphs = useMemo(() => {
    if (!listing.description) return [];
    return listing.description
      .split(/\n\n+/)
      .map((segment) => segment.trim())
      .filter(Boolean);
  }, [listing.description]);

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

        <section className="space-y-3 text-white/80">
          {descriptionParagraphs.length ? (
            descriptionParagraphs.map((paragraph, index) => (
              <p key={index} className="leading-relaxed">
                {paragraph}
              </p>
            ))
          ) : (
            <p>No additional description provided.</p>
          )}
        </section>

        <section className="space-y-2 text-sm text-white/70">
          <div className="flex flex-wrap items-center gap-3 text-white/80">
            {listing.payRate?.min || listing.payRate?.max ? (
              <span className="rounded-full bg-white/10 px-3 py-1">
                {formatPayRange(listing)}
              </span>
            ) : null}
            {listing.commitment ? (
              <span className="rounded-full bg-white/5 px-3 py-1 text-white/60">
                {listing.commitment}
              </span>
            ) : null}
            {listing.referralBoost?.active ? (
              <span className="rounded-full bg-whopPrimary/20 px-3 py-1 text-xs font-semibold text-whopPrimary-foreground">
                Referral boost active
              </span>
            ) : null}
          </div>
          {listing.metadata.hoursPerWeek ? (
            <p>Hours per week: {listing.metadata.hoursPerWeek}</p>
          ) : null}
          {listing.metadata.recentCandidatesCount ? (
            <p>Recent candidates: {listing.metadata.recentCandidatesCount}</p>
          ) : null}
        </section>

        <div className="mt-auto flex flex-col gap-3 pt-4">
          {listing.referralLink ? (
            <button
              type="button"
              onClick={() => onReferralClick?.(listing)}
              className="inline-flex items-center justify-center rounded-full bg-whopPrimary px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:shadow-lg"
              aria-label={`Open referral link for ${listing.title}`}
            >
              Open referral link
            </button>
          ) : (
            <span className="text-sm text-white/40">
              Referral link not available for this listing.
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
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
