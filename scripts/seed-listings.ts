import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index >= 0) {
    return process.argv[index + 1];
  }
  return undefined;
}

async function parseJsonl(filePath: string) {
  const entries: Record<string, unknown>[] = [];
  const stream = fs.createReadStream(filePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      entries.push(JSON.parse(trimmed));
    } catch (error) {
      console.warn(`Skipping malformed line: ${trimmed.slice(0, 60)}`, error);
    }
  }

  return entries;
}

async function main() {
  const fileArg = getArg("--file") ?? "docs/listings.jsonl";
  const filePath = path.resolve(process.cwd(), fileArg);

  if (!fs.existsSync(filePath)) {
    console.error(`Seed file not found at ${filePath}`);
    process.exitCode = 1;
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to run the seed script."
    );
    process.exitCode = 1;
    return;
  }

  const entries = await parseJsonl(filePath);
  if (!entries.length) {
    console.warn("No listings found in the provided file. Nothing to seed.");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  console.info(`Seeding ${entries.length} listings into Supabase...`);

  const { error } = await supabase.rpc("sync_job_listings", {
    records: entries
  });

  if (error) {
    console.error("Failed to seed listings", error);
    process.exitCode = 1;
    return;
  }

  console.info("Seeded listings successfully.");
}

main().catch((error) => {
  console.error("Unhandled error during listings seeding", error);
  process.exitCode = 1;
});
