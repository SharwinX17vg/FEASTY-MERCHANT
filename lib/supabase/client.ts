"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnvironment } from "./config-core";

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const { publishableKey, url } = getSupabaseEnvironment();
    browserClient = createBrowserClient(url, publishableKey);
  }
  return browserClient;
}
