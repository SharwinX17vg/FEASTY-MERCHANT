import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { InvalidJsonBodyError, readJsonObject } from "@/lib/http/request";
import { mutationErrorResponse } from "@/lib/supabase/errors";
import {
  validateBranch,
  type BranchInput,
} from "@/lib/validation/branch";

import { getValidatedWorkspaceContext } from "@/lib/workspace/context";

const branchFields = [
  "name",
  "address_line_1",
  "address_line_2",
  "city",
  "state",
  "postal_code",
  "country_code",
  "phone",
] as const;
const branchSelect =
  "id,business_id,code,name,address_line_1,address_line_2,city,state,postal_code,country_code,phone,status,created_at,updated_at";

async function getAuthorizedWorkspace(request?: Request) {
  const result = await getValidatedWorkspaceContext({ request });
  if ("error" in result) {
    return {
      supabase: await getSupabaseServerClient(),
      error: result.error,
      status: result.status as 401 | 403 | 404 | 503,
    };
  }
  if (!result.data.businessId) {
    return {
      supabase: await getSupabaseServerClient(),
      error: "Complete business details before managing branches.",
      status: 404 as const,
    };
  }

  return {
    supabase: await getSupabaseServerClient(),
    organizationId: result.data.organizationId,
    businessId: result.data.businessId,
    role: result.data.role,
    canManage: result.data.canManageBranch,
  };
}

function hasUnexpectedFields(input: Record<string, unknown>) {
  return Object.keys(input).some(
    (field) => !branchFields.includes(field as (typeof branchFields)[number]),
  );
}

export async function GET(request?: Request) {
  try {
    const result = await getAuthorizedWorkspace(request);
    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }

    const { data: branches, error } = await result.supabase
      .from("branches")
      .select(branchSelect)
      .eq("business_id", result.businessId)
      .order("created_at", { ascending: true });
    if (error) {
      return NextResponse.json({ message: "Unable to load branches." }, { status: 503 });
    }

    return NextResponse.json({ branches });
  } catch {
    return NextResponse.json({ message: "Unable to load branches." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await getAuthorizedWorkspace(request);
    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }
    if (!result.canManage) {
      return NextResponse.json({ message: "You do not have permission to add branches." }, { status: 403 });
    }

    const input = (await readJsonObject(request)) as BranchInput;
    if (hasUnexpectedFields(input as Record<string, unknown>)) {
      return NextResponse.json({ message: "This branch field cannot be changed." }, { status: 400 });
    }
    const validation = validateBranch(input);
    if (Object.keys(validation.errors).length > 0) {
      return NextResponse.json({ errors: validation.errors, message: "Review the highlighted fields." }, { status: 400 });
    }

    const { data: branch, error } = await result.supabase
      .from("branches")
      .insert({ business_id: result.businessId, ...validation.values })
      .select(branchSelect)
      .single();
    if (error || !branch) {
      const response = error
        ? mutationErrorResponse(error, "Unable to save the branch.")
        : { message: "Unable to save the branch.", status: 503 };
      return NextResponse.json({ message: response.message }, { status: response.status });
    }

    return NextResponse.json({ branch, message: "Branch added successfully." }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidJsonBodyError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Unable to save the branch." }, { status: 503 });
  }
}

export { branchFields, branchSelect, getAuthorizedWorkspace, hasUnexpectedFields };
