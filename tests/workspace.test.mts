import assert from "node:assert/strict";
import test from "node:test";

type OrganizationMember = { organization_id: string; role: string; status: string };
type Business = { id: string; organization_id: string; name: string };
type Branch = { id: string; business_id: string; name: string };

function resolveWorkspaceContext(
  memberships: OrganizationMember[],
  businesses: Business[],
  preferredOrgId?: string,
  preferredBizId?: string,
) {
  if (memberships.length === 0) {
    return { error: "No active merchant workspace was found.", status: 403 };
  }

  let activeMembership = memberships.find((m) => m.organization_id === preferredOrgId);
  if (!activeMembership) {
    activeMembership = memberships[0];
  }

  const organizationId = activeMembership.organization_id;
  const role = activeMembership.role;

  const orgBusinesses = businesses.filter((b) => b.organization_id === organizationId);
  let activeBusiness = orgBusinesses.find((b) => b.id === preferredBizId) ?? null;
  if (!activeBusiness && orgBusinesses.length > 0) {
    activeBusiness = orgBusinesses[0];
  }

  return {
    organizationId,
    businessId: activeBusiness?.id ?? null,
    role,
    business: activeBusiness,
    availableBusinesses: orgBusinesses,
  };
}

function validateBranchContext(branches: Branch[], targetBusinessId: string, requestedBranchId: string) {
  const branch = branches.find((b) => b.id === requestedBranchId && b.business_id === targetBusinessId);
  if (!branch) {
    return { error: "Branch not found or belongs to a different business.", status: 404 };
  }
  return { branch };
}

test("resolves context deterministically for a single-organization single-business merchant", () => {
  const memberships = [{ organization_id: "org-1", role: "org_owner", status: "active" }];
  const businesses = [{ id: "biz-1", organization_id: "org-1", name: "Main Diner" }];

  const result = resolveWorkspaceContext(memberships, businesses);
  assert.equal("error" in result, false);
  if ("organizationId" in result) {
    assert.equal(result.organizationId, "org-1");
    assert.equal(result.businessId, "biz-1");
    assert.equal(result.role, "org_owner");
  }
});

test("allows selecting a specific valid organization and business", () => {
  const memberships = [
    { organization_id: "org-1", role: "org_owner", status: "active" },
    { organization_id: "org-2", role: "admin", status: "active" },
  ];
  const businesses = [
    { id: "biz-1", organization_id: "org-1", name: "Biz 1" },
    { id: "biz-2", organization_id: "org-2", name: "Biz 2" },
  ];

  const result = resolveWorkspaceContext(memberships, businesses, "org-2", "biz-2");
  assert.equal("error" in result, false);
  if ("organizationId" in result) {
    assert.equal(result.organizationId, "org-2");
    assert.equal(result.businessId, "biz-2");
    assert.equal(result.role, "admin");
  }
});

test("rejects an unassigned organization preference and falls back safely", () => {
  const memberships = [{ organization_id: "org-1", role: "org_owner", status: "active" }];
  const businesses = [{ id: "biz-1", organization_id: "org-1", name: "Biz 1" }];

  const result = resolveWorkspaceContext(memberships, businesses, "unassigned-org-999");
  assert.equal("error" in result, false);
  if ("organizationId" in result) {
    assert.equal(result.organizationId, "org-1");
    assert.equal(result.businessId, "biz-1");
  }
});

test("rejects a business belonging to a different organization and falls back safely", () => {
  const memberships = [{ organization_id: "org-1", role: "org_owner", status: "active" }];
  const businesses = [
    { id: "biz-1", organization_id: "org-1", name: "Biz 1" },
    { id: "biz-other-org", organization_id: "org-other", name: "Other Org Biz" },
  ];

  const result = resolveWorkspaceContext(memberships, businesses, "org-1", "biz-other-org");
  assert.equal("error" in result, false);
  if ("organizationId" in result) {
    assert.equal(result.organizationId, "org-1");
    assert.equal(result.businessId, "biz-1");
    assert.equal(result.business?.name, "Biz 1");
  }
});

test("validates branch ownership against active business", () => {
  const branches = [
    { id: "brn-1", business_id: "biz-1", name: "Downtown" },
    { id: "brn-2", business_id: "biz-2", name: "Uptown" },
  ];

  const valid = validateBranchContext(branches, "biz-1", "brn-1");
  assert.equal("branch" in valid, true);

  const invalid = validateBranchContext(branches, "biz-1", "brn-2");
  assert.equal("error" in invalid, true);
  if ("error" in invalid) {
    assert.equal(invalid.status, 404);
  }
});
