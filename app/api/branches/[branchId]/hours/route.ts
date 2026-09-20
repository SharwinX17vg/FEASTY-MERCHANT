import { NextResponse } from "next/server";

import { getAuthorizedWorkspace } from "@/app/api/branches/route";
import {
  isBusinessHoursInput,
  validateBusinessHours,
  type BusinessHoursInput,
} from "@/lib/validation/business-hours";

type RouteContext = { params: Promise<{ branchId: string }> };
const managerRoles = new Set(["org_owner", "admin", "moderator", "branch_manager"]);

async function getScopedBranch(branchId: string) {
  const result = await getAuthorizedWorkspace();
  if ("error" in result) return result;

  const { data: branch, error } = await result.supabase
    .from("branches")
    .select("id,business_id,name,opening_hours,status")
    .eq("id", branchId)
    .eq("business_id", result.businessId)
    .maybeSingle();
  if (error) {
    return {
      supabase: result.supabase,
      error: "Unable to load branch hours.",
      status: 503 as const,
    };
  }
  if (!branch) {
    return {
      supabase: result.supabase,
      error: "Branch not found.",
      status: 404 as const,
    };
  }
  return { ...result, branch };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { branchId } = await context.params;
    const result = await getScopedBranch(branchId);
    if ("error" in result || !("branch" in result)) {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }
    return NextResponse.json({
      branch: {
        id: result.branch.id,
        name: result.branch.name,
        status: result.branch.status,
      },
      hours: result.branch.opening_hours,
    });
  } catch {
    return NextResponse.json({ message: "Unable to load branch hours." }, { status: 503 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { branchId } = await context.params;
    const result = await getScopedBranch(branchId);
    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }
    if (!managerRoles.has(result.role ?? "")) {
      return NextResponse.json(
        { message: "You do not have permission to manage branch hours." },
        { status: 403 },
      );
    }

    const input = (await request.json()) as { hours?: unknown };
    if (!isBusinessHoursInput(input.hours)) {
      return NextResponse.json({ message: "Provide a valid weekly schedule." }, { status: 400 });
    }
    const validation = validateBusinessHours(input.hours as BusinessHoursInput);
    if (Object.keys(validation.errors).length > 0) {
      return NextResponse.json(
        { errors: validation.errors, message: "Review the highlighted hours." },
        { status: 400 },
      );
    }

    const { data: branch, error } = await result.supabase
      .from("branches")
      .update({ opening_hours: validation.values })
      .eq("id", branchId)
      .eq("business_id", result.businessId)
      .select("id,name,opening_hours,status")
      .single();
    if (error || !branch) {
      return NextResponse.json({ message: "Unable to save branch hours." }, { status: 403 });
    }

    return NextResponse.json({
      branch,
      hours: branch.opening_hours,
      message: "Business hours saved.",
    });
  } catch {
    return NextResponse.json({ message: "Unable to save branch hours." }, { status: 503 });
  }
}
