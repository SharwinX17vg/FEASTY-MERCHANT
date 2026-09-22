import "server-only";

import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export const ACTIVE_ORG_COOKIE = "feasty_active_org_id";
export const ACTIVE_BIZ_COOKIE = "feasty_active_biz_id";

export type OrganizationSummary = {
  code: string;
  id: string;
  name: string;
};

export type BusinessSummary = {
  category: string;
  code: string;
  description: string | null;
  email: string | null;
  id: string;
  name: string;
  organization_id: string;
  phone: string | null;
  status: string;
  website_url: string | null;
};

export type OrganizationMember = {
  organization_id: string;
  role: string;
  status: string;
};

export type ValidatedWorkspaceContext = {
  business: BusinessSummary | null;
  businesses: BusinessSummary[];
  businessId: string | null;
  canManageBranch: boolean;
  canManageBusiness: boolean;
  organization: OrganizationSummary | null;
  organizationId: string;
  organizations: OrganizationSummary[];
  role: string;
  user: User;
};

export type WorkspaceContextOptions = {
  preferredBusinessId?: string | null;
  preferredOrganizationId?: string | null;
  request?: Request;
};

const managerRoles = new Set(["org_owner", "admin", "moderator"]);
const branchManagerRoles = new Set(["org_owner", "admin", "moderator", "branch_manager"]);

export async function getValidatedWorkspaceContext(
  options?: WorkspaceContextOptions,
): Promise<{ data: ValidatedWorkspaceContext } | { error: string; status: number }> {
  const supabase = await getSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { error: "Sign in required.", status: 401 };
  }

  const { data: rawMemberships, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id,role,status")
    .eq("user_id", authData.user.id)
    .eq("status", "active");

  if (memberError) {
    return { error: "Unable to verify workspace access.", status: 503 };
  }

  const memberships = (rawMemberships ?? []) as OrganizationMember[];
  if (memberships.length === 0) {
    return { error: "No active merchant workspace was found.", status: 403 };
  }

  let cookieOrgId: string | undefined;
  let cookieBizId: string | undefined;
  try {
    const cookieStore = await cookies();
    cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
    cookieBizId = cookieStore.get(ACTIVE_BIZ_COOKIE)?.value;
  } catch {
    // cookies() is not available in non-request contexts
  }

  const headerOrgId = options?.request?.headers.get("x-feasty-org-id");
  const headerBizId = options?.request?.headers.get("x-feasty-biz-id");

  const preferredOrgId =
    options?.preferredOrganizationId ?? headerOrgId ?? cookieOrgId ?? undefined;
  const preferredBizId =
    options?.preferredBusinessId ?? headerBizId ?? cookieBizId ?? undefined;

  let activeMembership = memberships.find((m) => m.organization_id === preferredOrgId);
  if (!activeMembership) {
    activeMembership = memberships[0];
  }

  const organizationId = activeMembership.organization_id;
  const role = activeMembership.role;

  const orgIds = Array.from(new Set(memberships.map((m) => m.organization_id)));
  const { data: rawOrganizations } = await supabase
    .from("organizations")
    .select("id,code,name")
    .in("id", orgIds);

  const organizations = (rawOrganizations ?? []) as OrganizationSummary[];
  const activeOrganization = organizations.find((o) => o.id === organizationId) ?? null;

  const { data: rawBusinesses, error: bizError } = await supabase
    .from("businesses")
    .select("id,organization_id,code,name,category,description,email,phone,website_url,status")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (bizError) {
    return { error: "Unable to load business workspace records.", status: 503 };
  }

  const businesses = (rawBusinesses ?? []) as BusinessSummary[];
  let activeBusiness = businesses.find((b) => b.id === preferredBizId) ?? null;
  if (!activeBusiness && businesses.length > 0) {
    activeBusiness = businesses[0];
  }

  return {
    data: {
      user: authData.user,
      organizationId,
      businessId: activeBusiness?.id ?? null,
      role,
      organization: activeOrganization,
      business: activeBusiness,
      businesses,
      organizations,
      canManageBusiness: managerRoles.has(role),
      canManageBranch: branchManagerRoles.has(role),
    },
  };
}
