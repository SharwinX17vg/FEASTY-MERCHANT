import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseClient } from "@/services/supabase";

export function getSupabaseServerClient(): SupabaseClient {
  return createSupabaseClient();
}
