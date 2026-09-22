import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { InvalidJsonBodyError, readJsonObject } from "@/lib/http/request";
import { mutationErrorResponse } from "@/lib/supabase/errors";
import {
  validateBusinessProfile,
  type BusinessProfileInput,
} from "@/lib/validation/business-profile";

import { getValidatedWorkspaceContext } from "@/lib/workspace/context";

const editableBusinessFields = [
  "name",
  "category",
  "description",
  "email",
  "phone",
  "website_url",
] as const;

async function getAuthorizedBusiness(request?: Request) {
  const result = await getValidatedWorkspaceContext({ request });
  if ("error" in result) {
    return {
      supabase: await getSupabaseServerClient(),
      error: result.error,
      status: result.status as 401 | 403 | 404 | 503,
    };
  }
  if (!result.data.canManageBusiness) {
    return {
      supabase: await getSupabaseServerClient(),
      error: "You do not have permission to manage this business.",
      status: 403 as const,
    };
  }
  if (!result.data.business) {
    return {
      supabase: await getSupabaseServerClient(),
      error: "No business profile is available for this workspace.",
      status: 404 as const,
    };
  }

  return { supabase: await getSupabaseServerClient(), business: result.data.business };
}

export async function GET(request?: Request) {
  try {
    const result = await getAuthorizedBusiness(request);
    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }
    return NextResponse.json({ business: result.business });
  } catch {
    return NextResponse.json({ message: "Unable to load the business profile." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const result = await getAuthorizedBusiness(request);
    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }

    const input = (await readJsonObject(request)) as BusinessProfileInput;
    const unexpectedField = Object.keys(input).find(
      (field) => !editableBusinessFields.includes(field as (typeof editableBusinessFields)[number]),
    );
    if (unexpectedField) {
      return NextResponse.json({ message: "This profile field cannot be changed." }, { status: 400 });
    }

    const validation = validateBusinessProfile(input);
    if (Object.keys(validation.errors).length > 0) {
      return NextResponse.json({ errors: validation.errors, message: "Review the highlighted fields." }, { status: 400 });
    }

    const { data: business, error } = await result.supabase
      .from("businesses")
      .update(validation.values)
      .eq("id", result.business.id)
      .eq("organization_id", result.business.organization_id)
      .select("id,organization_id,code,name,category,description,email,phone,website_url,status,created_at,updated_at")
      .single();
    if (error || !business) {
      const response = error
        ? mutationErrorResponse(error, "Unable to save the business profile.")
        : { message: "Unable to save the business profile.", status: 503 };
      return NextResponse.json({ message: response.message }, { status: response.status });
    }

    return NextResponse.json({ business, message: "Business profile saved." });
  } catch (error) {
    if (error instanceof InvalidJsonBodyError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Unable to save the business profile." }, { status: 503 });
  }
}
