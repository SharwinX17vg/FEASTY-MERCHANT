import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentOnboarding } from "@/lib/onboarding/server";
import { validateBusinessProfile } from "@/lib/validation/business-profile";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as {
      category?: string;
      email?: string;
      name?: string;
      phone?: string;
    };
    const current = await getCurrentOnboarding();
    const validation = validateBusinessProfile({
      name: input.name,
      category: input.category ?? current?.category,
      email: input.email,
      phone: input.phone,
    });
    if (Object.keys(validation.errors).length > 0) {
      return NextResponse.json(
        { errors: validation.errors, message: "Enter valid business details." },
        { status: 400 },
      );
    }

    const supabase = await getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return NextResponse.json({ message: "Sign in required." }, { status: 401 });

    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", authData.user.id)
      .eq("status", "active")
      .maybeSingle();

    let organizationId = membership?.organization_id;
    if (!organizationId) {
      const organization = await supabase
        .from("organizations")
        .insert({
          name: validation.values.name,
          email: validation.values.email || authData.user.email,
          phone: validation.values.phone || null,
          created_by: authData.user.id,
        })
        .select("id")
        .single();
      if (organization.error) return NextResponse.json({ message: "Unable to create your organization." }, { status: 400 });
      organizationId = organization.data.id;
    }

    const existing = await supabase.from("businesses").select("id").eq("organization_id", organizationId).maybeSingle();
    if (existing.error) return NextResponse.json({ message: "Unable to check existing business records." }, { status: 400 });
    if (existing.data) {
      return NextResponse.json({ id: existing.data.id, existing: true });
    }

    const business = await supabase
      .from("businesses")
      .insert({
        organization_id: organizationId,
        name: validation.values.name,
        category: validation.values.category,
        email: validation.values.email || null,
        phone: validation.values.phone || null,
        created_by: authData.user.id,
      })
      .select("id")
      .single();
    if (business.error) return NextResponse.json({ message: "Unable to save your business." }, { status: 400 });
    return NextResponse.json({ id: business.data.id });
  } catch {
    return NextResponse.json({ message: "Unable to save onboarding details." }, { status: 503 });
  }
}
