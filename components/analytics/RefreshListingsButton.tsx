"use client";

import { useState } from "react";

type RefreshState = "idle" | "running" | "success" | "error";

interface RefreshResult {
  jobId: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  message?: string;
  recordsWritten?: number;
}

interface RefreshListingsButtonProps {
  companyId: string;
}

export function RefreshListingsButton({ companyId }: RefreshListingsButtonProps) {
  const [state, setState] = useState<RefreshState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = async () => {
    setState("running");
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/listings/refresh?companyId=${encodeURIComponent(companyId)}`,
        {
          method: "POST"
        }
      );

      const payload = (await response.json()) as RefreshResult & {
        error?: string;
      };

      if (!response.ok) {
        const errorMessage = payload.error ?? payload.message ?? "Refresh failed";
        setState("error");
        setMessage(errorMessage);
        return;
      }

      setState("success");
      const recordMessage =
        typeof payload.recordsWritten === "number"
          ? `${payload.recordsWritten} listings refreshed.`
          : "Listings refreshed.";
      setMessage(recordMessage);
    } catch (error) {
      console.error("Failed to refresh listings", error);
      setState("error");
      setMessage("Refresh failed. Try again in a moment.");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "running"}
        className="inline-flex items-center justify-center rounded-full bg-whopPrimary px-4 py-2 text-sm font-semibold text-white transition hover:shadow-card disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "running" ? "Refreshing…" : "Refresh Listings"}
      </button>
      {message ? (
        <p
          className={`text-sm ${
            state === "error" ? "text-red-300" : "text-white/70"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
