import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { validateBranch } from "@/lib/validation/branch";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as Record<string, unknown>;
    const validation = validateBranch({
      name: input.name,
      address_line_1: input.addressLine1,
      address_line_2: input.addressLine2,
      city: input.city,
      state: input.state,
      postal_code: input.postalCode,
      country_code: input.countryCode,
      phone: input.phone,
    });
    if (Object.keys(validation.errors).length > 0) {
      return NextResponse.json(
        { errors: validation.errors, message: "Enter valid location details." },
        { status: 400 },
      );
    }
    const supabase = await getSupabaseServerClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
    const { data: membership } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.user.id).eq("status", "active").maybeSingle();
    if (!membership) return NextResponse.json({ message: "Complete business details first." }, { status: 400 });
    const { data: business } = await supabase.from("businesses").select("id").eq("organization_id", membership.organization_id).maybeSingle();
    if (!business) return NextResponse.json({ message: "Complete business details first." }, { status: 400 });
    const existingBranch = await supabase
      .from("branches")
      .select("id")
      .eq("business_id", business.id)
      .maybeSingle();
    if (existingBranch.error) {
      return NextResponse.json({ message: "Unable to check existing branch records." }, { status: 400 });
    }
    if (existingBranch.data) {
      return NextResponse.json({ id: existingBranch.data.id, existing: true });
    }

    const branch = await supabase.from("branches").insert({
      business_id: business.id,
      name: validation.values.name,
      address_line_1: validation.values.address_line_1,
      address_line_2: validation.values.address_line_2,
      city: validation.values.city,
      state: validation.values.state,
      postal_code: validation.values.postal_code,
      country_code: validation.values.country_code,
      phone: validation.values.phone,
    }).select("id").single();
    if (branch.error) return NextResponse.json({ message: "Unable to save your branch." }, { status: 400 });
    return NextResponse.json({ id: branch.data.id });
  } catch {
    return NextResponse.json({ message: "Unable to save branch details." }, { status: 503 });
  }
}
