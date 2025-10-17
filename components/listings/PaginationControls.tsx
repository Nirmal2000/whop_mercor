"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  basePath: string;
}

export function PaginationControls({ page, totalPages, basePath }: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("page", String(nextPage));
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  };

  return (
    <nav className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80" aria-label="Listings pagination">
      <button
        type="button"
        onClick={() => goToPage(Math.max(page - 1, 1))}
        disabled={page <= 1}
        className="rounded-full px-3 py-1 text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/30"
      >
        Previous
      </button>
      <span className="text-white/60">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => goToPage(Math.min(page + 1, totalPages))}
        disabled={page >= totalPages}
        className="rounded-full px-3 py-1 text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/30"
      >
        Next page
      </button>
    </nav>
  );
}
