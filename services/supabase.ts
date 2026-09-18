import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseConfig = {
  anonKey: string;
  url: string;
};

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.",
    );
  }

  return { anonKey, url };
}

export function createSupabaseClient(): SupabaseClient {
  const { anonKey, url } = getSupabaseConfig();
  return createClient(url, anonKey);
}
