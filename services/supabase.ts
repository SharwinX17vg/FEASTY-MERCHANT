import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnvironment } from "@/lib/supabase/config";

export type SupabaseConfig = {
  anonKey: string;
  url: string;
};

export function getSupabaseConfig(): SupabaseConfig {
  const { publishableKey, url } = getSupabaseEnvironment();
  return { anonKey: publishableKey, url };
}

export function createSupabaseClient(): SupabaseClient {
  const { anonKey, url } = getSupabaseConfig();
  return createClient(url, anonKey);
}
