import { setTimeout as delay } from "timers/promises";

export interface FetchOptions {
  token?: string;
  delayMs?: number;
}

export interface FlattenedListing extends Record<string, unknown> {
  listingId: string;
}

const DEFAULT_API_BASE = process.env.MERCOR_API_BASE ?? "https://work.mercor.com/api";
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 500;

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    accept: "application/json, text/plain, */*",
    "content-type": "application/json",
    origin: "https://work.mercor.com",
    "user-agent": process.env.MERCOR_USER_AGENT ??
      "whop-job-listings-sync/1.0 (https://github.com/whop)"
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  return headers;
}

function buildListingsUrl(): string {
  return `${DEFAULT_API_BASE}/listings-public?search=&version=v2`;
}

function buildListingDetailUrl(listingId: string): string {
  return `${DEFAULT_API_BASE}/listings/${encodeURIComponent(
    listingId
  )}?includeRecentWeekCount=true&includeAboutCompany=true`;
}

async function fetchJson<T>(url: string, options: FetchOptions): Promise<T> {
  const headers = buildHeaders(options.token);
  let attempt = 0;
  let lastError: unknown;

  while (attempt < MAX_RETRIES) {
    try {
      console.log(`[ingestion] Fetching URL: ${url} (attempt ${attempt + 1})`);
      const response = await fetch(url, {
        method: "GET",
        headers,
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= MAX_RETRIES) {
        break;
      }
      await delay(RETRY_BACKOFF_MS * attempt);
    }
  }

  throw lastError ?? new Error("Unknown network error while fetching Mercor API");
}

export async function fetchListingSummaries(
  options: FetchOptions = {}
): Promise<Record<string, unknown>[]> {
  return fetchJson<Record<string, unknown>[]>(buildListingsUrl(), options);
}

export async function fetchListingDetail(
  listingId: string,
  options: FetchOptions = {}
): Promise<Record<string, unknown>> {
  return fetchJson<Record<string, unknown>>(
    buildListingDetailUrl(listingId),
    options
  );
}

function toSerializable(value: unknown): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toSerializable(item));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object" && value) {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([key, inner]) => [key, toSerializable(inner)]
    );
    return Object.fromEntries(entries);
  }

  return value ?? null;
}

export function flattenListing(
  summary: Record<string, unknown>,
  detail: Record<string, unknown>
): FlattenedListing {
  const flattened: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(summary)) {
    flattened[key] = toSerializable(value);
  }

  for (const [key, value] of Object.entries(detail)) {
    const serialised = toSerializable(value);
    let targetKey = key;
    if (
      Object.prototype.hasOwnProperty.call(flattened, targetKey) &&
      flattened[targetKey] !== serialised
    ) {
      targetKey = `detail_${targetKey}`;
    }
    flattened[targetKey] = serialised;
  }

  const rateMin = toNumberOrUndefined(flattened.rateMin ?? flattened.detail_rateMin);
  const rateMax = toNumberOrUndefined(flattened.rateMax ?? flattened.detail_rateMax);

  if (typeof rateMin === "number" && typeof rateMax === "number") {
    flattened.rateRangeDisplay = `${trimTrailingZeros(rateMin)} - ${trimTrailingZeros(
      rateMax
    )}`;
  } else {
    flattened.rateRangeDisplay = null;
  }

  const listingId = flattened.listingId as string;
  if (!listingId) {
    throw new Error("flattenListing requires listingId in summary payload");
  }

  return flattened as FlattenedListing;
}

function trimTrailingZeros(value: number): string {
  return Number.parseFloat(value.toString()).toString();
}

function toNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

export interface FetchAndFlattenOptions extends FetchOptions {
  concurrency?: number;
}

export async function fetchAndFlattenListings(
  options: FetchAndFlattenOptions = {}
): Promise<FlattenedListing[]> {
  const summaries = await fetchListingSummaries(options);
  const concurrency = Math.max(1, options.concurrency ?? 8);
  const results: FlattenedListing[] = new Array(summaries.length);
  let index = 0;

  async function worker() {
    while (true) {
      const currentIndex = index;
      if (currentIndex >= summaries.length) {
        break;
      }
      index += 1;

      const summary = summaries[currentIndex];
      const listingId = summary?.listingId as string | undefined;
      let detail: Record<string, unknown> = {};

      if (listingId) {
        try {
          detail = await fetchListingDetail(listingId, options);
        } catch (error) {
          console.warn(
            `[ingestion] Failed to fetch detail for ${listingId}:`,
            error
          );
        }
      }

      try {
        results[currentIndex] = flattenListing(summary, detail);
      } catch (error) {
        console.warn(
          `[ingestion] Skipping listing without valid identifier at index ${currentIndex}`,
          error
        );
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  return results.filter(Boolean);
}
