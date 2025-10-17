import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

function assertEnv(variable: string | undefined, name: string): string {
  if (!variable) {
    throw new Error(
      `Missing required environment variable ${name} for Supabase service role client.`
    );
  }
  return variable;
}

/**
 * Returns a Supabase client authenticated with the service role key. The client is
 * memoized for reuse across requests within the same runtime.
 */
export function getServiceRoleSupabaseClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = assertEnv(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    "SUPABASE_URL"
  );
  const serviceRoleKey = assertEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_SERVICE_ROLE_KEY"
  );

  cachedClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  return cachedClient;
}
