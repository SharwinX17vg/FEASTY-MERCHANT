import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  validateBusinessProfile,
  type BusinessProfileInput,
} from "@/lib/validation/business-profile";

const editableBusinessFields = [
  "name",
  "category",
  "description",
  "email",
  "phone",
  "website_url",
] as const;
const managerRoles = new Set(["org_owner", "admin", "moderator"]);

async function getAuthorizedBusiness() {
  const supabase = await getSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { supabase, error: "Sign in required.", status: 401 as const };

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id,role")
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .maybeSingle();
  if (membershipError) return { supabase, error: "Unable to verify workspace access.", status: 503 as const };
  if (!membership || !managerRoles.has(membership.role)) {
    return { supabase, error: "You do not have permission to manage this business.", status: 403 as const };
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id,organization_id,code,name,category,description,email,phone,website_url,status,created_at,updated_at")
    .eq("organization_id", membership.organization_id)
    .maybeSingle();
  if (businessError) return { supabase, error: "Unable to load the business profile.", status: 503 as const };
  if (!business) return { supabase, error: "No business profile is available for this workspace.", status: 404 as const };

  return { supabase, business };
}

export async function GET() {
  try {
    const result = await getAuthorizedBusiness();
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
    const result = await getAuthorizedBusiness();
    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }

    const input = (await request.json()) as BusinessProfileInput;
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
      return NextResponse.json({ message: "Unable to save the business profile." }, { status: 403 });
    }

    return NextResponse.json({ business, message: "Business profile saved." });
  } catch {
    return NextResponse.json({ message: "Unable to save the business profile." }, { status: 503 });
  }
}
