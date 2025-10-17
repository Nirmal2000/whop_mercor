import { cookies, headers } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY environment variable."
  );
}

/**
 * Creates a Supabase server client scoped to the incoming request for
 * server components, route handlers, and server actions.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    global: {
      headers: {
        "X-Client-Info": "whop-job-listings/1.0.0",
        // forward whop session headers to Supabase if needed
        Authorization: headerStore.get("Authorization") ?? ""
      }
    },
    auth: {
      persistSession: false
    },
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      }
    }
  });
}
