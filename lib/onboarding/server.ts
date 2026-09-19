import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  resolveOnboardingState,
  type OnboardingSnapshot,
} from "@/lib/onboarding/state";

export async function getCurrentOnboarding() {
  const supabase = await getSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_category")
    .eq("id", authData.user.id)
    .maybeSingle();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .maybeSingle();

  const snapshot: OnboardingSnapshot = {
    category: profile?.onboarding_category,
  };

  if (membership) {
    const { data: business } = await supabase
      .from("businesses")
      .select("id,name,category")
      .eq("organization_id", membership.organization_id)
      .maybeSingle();
    snapshot.business = business;

    if (business) {
      const { data: branch } = await supabase
        .from("branches")
        .select("id,name")
        .eq("business_id", business.id)
        .maybeSingle();
      snapshot.branch = branch;

      if (branch) {
        const { data: verification } = await supabase
          .from("verification_requests")
          .select("id,status")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        snapshot.verification = verification;
      }
    }
  }

  return {
    ...snapshot,
    state: resolveOnboardingState(snapshot),
  };
}
