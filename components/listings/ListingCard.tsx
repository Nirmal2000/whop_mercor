import type { KeyboardEvent, MouseEvent } from "react";
import type { ListingSummary } from "@/lib/supabase/listings";
import clsx from "clsx";

interface ListingCardProps {
  listing: ListingSummary;
  onSelect?: (listing: ListingSummary, element: HTMLDivElement) => void;
  onReferralClick?: (listing: ListingSummary) => void;
}

export function ListingCard({ listing, onSelect, onReferralClick }: ListingCardProps) {
  const payRange = formatPayRange(listing);
  const referralUrl = buildReferralUrl(listing.listingId);
  const referralEnabled = Boolean(referralUrl);
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    onSelect?.(listing, event.currentTarget);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect?.(listing, event.currentTarget);
    }
  };

  const handleReferralClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!referralUrl) {
      return;
    }
    onReferralClick?.({
      ...listing,
      referralLink: referralUrl
    });
  };

  return (
    <article
      data-testid="listing-card"
      onClick={handleClick}
      className={clsx(
        "group flex cursor-pointer flex-col justify-between gap-6 rounded-2xl bg-white/5 p-6 shadow-card transition hover:bg-white/10",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-whopPrimary"
      )}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${listing.title}`}
      onKeyDown={handleKeyDown}
      data-listing-id={listing.listingId}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">{listing.title}</h3>
          {listing.referralAmount ? (
            <span className="rounded-full bg-whopPrimary/20 px-3 py-1 text-sm font-medium text-whopPrimary-foreground">
              ${listing.referralAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          ) : (
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/60">Referral</span>
          )}
        </div>
        <p className="text-sm text-white/70">
          {listing.company ?? "Company undisclosed"}
        </p>
        <p className="text-sm text-white/60">
          {listing.location ?? "Remote friendly"}
        </p>
        <div className="text-sm text-white/80">{payRange}</div>
        <div className="text-xs uppercase tracking-wide text-white/50">
          {listing.commitment ?? "Flexible commitment"}
        </div>
      </div>
      <button
        type="button"
        className="mt-auto inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-whopPrimary hover:bg-whopPrimary disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
        onClick={handleReferralClick}
        disabled={!referralEnabled}
        aria-disabled={!referralEnabled}
        aria-label={
          referralEnabled
            ? `View job posting for ${listing.title}`
            : `Referral unavailable for ${listing.title}`
        }
      >
        {referralEnabled ? "View job posting" : "Referral unavailable"}
      </button>
    </article>
  );
}

function formatPayRange(listing: ListingSummary): string {
  const { min, max, frequency } = listing.payRate ?? {};

  if (!min && !max) {
    return "Pay rate not shared";
  }

  if (min && max && min !== max) {
    return `${formatCurrency(min)} - ${formatCurrency(max)} ${frequency ?? ""}`.trim();
  }

  const value = formatCurrency(min ?? max ?? 0);
  return `${value} ${frequency ?? ""}`.trim();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount);
}

function buildReferralUrl(listingId: string): string | null {
  if (!listingId) {
    return null;
  }
  return `https://work.mercor.com/jobs/${listingId}?referralCode=b5b1c23c-b43c-4403-83c8-27e33c484fa9&utm_source=referral&utm_medium=share&utm_campaign=job_referral`;
}
