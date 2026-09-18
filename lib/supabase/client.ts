import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseClient } from "@/services/supabase";

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  browserClient ??= createSupabaseClient();
  return browserClient;
}
