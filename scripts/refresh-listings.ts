#!/usr/bin/env ts-node
import { runListingsSync } from "@/lib/ingestion/sync-listings";

async function main() {
  try {
    const result = await runListingsSync();
    console.log(
      `Listings refresh complete. Records written: ${result.recordsWritten}.`
    );
    process.exit(0);
  } catch (error) {
    console.error("Listings refresh failed", error);
    process.exit(1);
  }
}

void main();
