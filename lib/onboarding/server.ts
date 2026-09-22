import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  resolveOnboardingState,
  type OnboardingSnapshot,
} from "@/lib/onboarding/state";

import { getValidatedWorkspaceContext } from "@/lib/workspace/context";

export async function getCurrentOnboarding() {
  const supabase = await getSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_category")
    .eq("id", authData.user.id)
    .maybeSingle();

  const snapshot: OnboardingSnapshot = {
    category: profile?.onboarding_category,
  };

  const contextResult = await getValidatedWorkspaceContext();
  if ("data" in contextResult && contextResult.data.business) {
    const business = contextResult.data.business;
    snapshot.business = {
      id: business.id,
      name: business.name,
      category: business.category,
    };

    const { data: branches } = await supabase
      .from("branches")
      .select("id,name")
      .eq("business_id", business.id)
      .order("created_at", { ascending: true })
      .limit(1);

    const branch = branches?.[0] ?? null;
    snapshot.branch = branch;

    if (branch) {
      const { data: verifications } = await supabase
        .from("verification_requests")
        .select("id,status")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(1);

      snapshot.verification = verifications?.[0] ?? null;
    }
  }

  return {
    ...snapshot,
    state: resolveOnboardingState(snapshot),
  };
}
