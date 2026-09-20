import { NextResponse } from "next/server";

import {
  branchFields,
  branchSelect,
  getAuthorizedWorkspace,
} from "@/app/api/branches/route";
import { validateBranch, type BranchInput } from "@/lib/validation/branch";

type RouteContext = { params: Promise<{ branchId: string }> };
const managerRoles = new Set(["org_owner", "admin", "moderator", "branch_manager"]);

async function getScopedBranch(branchId: string) {
  const result = await getAuthorizedWorkspace();
  if ("error" in result) return result;
  const { data: branch, error } = await result.supabase
    .from("branches")
    .select(branchSelect)
    .eq("id", branchId)
    .eq("business_id", result.businessId)
    .maybeSingle();
  if (error) return { supabase: result.supabase, error: "Unable to load the branch.", status: 503 as const };
  if (!branch) return { supabase: result.supabase, error: "Branch not found.", status: 404 as const };
  return { ...result, branch };
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { branchId } = await context.params;
    const result = await getScopedBranch(branchId);
    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }
    if (!managerRoles.has(result.role ?? "")) {
      return NextResponse.json({ message: "You do not have permission to edit branches." }, { status: 403 });
    }

    const input = (await request.json()) as BranchInput;
    if (Object.keys(input).some((field) => !branchFields.includes(field as (typeof branchFields)[number]))) {
      return NextResponse.json({ message: "This branch field cannot be changed." }, { status: 400 });
    }
    const validation = validateBranch(input);
    if (Object.keys(validation.errors).length > 0) {
      return NextResponse.json({ errors: validation.errors, message: "Review the highlighted fields." }, { status: 400 });
    }
    const { data: branch, error } = await result.supabase
      .from("branches")
      .update(validation.values)
      .eq("id", branchId)
      .eq("business_id", result.businessId)
      .select(branchSelect)
      .single();
    if (error || !branch) return NextResponse.json({ message: "Unable to save the branch." }, { status: 403 });
    return NextResponse.json({ branch, message: "Branch changes saved." });
  } catch {
    return NextResponse.json({ message: "Unable to save the branch." }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { branchId } = await context.params;
    const result = await getScopedBranch(branchId);
    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }
    if (!managerRoles.has(result.role ?? "")) {
      return NextResponse.json({ message: "You do not have permission to change branch status." }, { status: 403 });
    }
    const input = (await request.json()) as { status?: unknown };
    if (!["active", "inactive", "archived"].includes(String(input.status))) {
      return NextResponse.json({ message: "Choose a valid branch status." }, { status: 400 });
    }
    const { data: branch, error } = await result.supabase
      .from("branches")
      .update({ status: input.status })
      .eq("id", branchId)
      .eq("business_id", result.businessId)
      .select(branchSelect)
      .single();
    if (error || !branch) return NextResponse.json({ message: "Unable to update branch status." }, { status: 403 });
    return NextResponse.json({ branch, message: `Branch marked ${input.status}.` });
  } catch {
    return NextResponse.json({ message: "Unable to update branch status." }, { status: 503 });
  }
}
