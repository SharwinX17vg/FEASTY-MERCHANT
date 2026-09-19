import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as { category?: string };
    const category = String(input.category ?? "").trim();
    if (category.length < 2) {
      return NextResponse.json({ message: "Select a business category." }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return NextResponse.json({ message: "Sign in required." }, { status: 401 });

    const { data: profile, error } = await supabase
      .from("profiles")
      .update({
        onboarding_category: category,
      })
      .eq("id", authData.user.id)
      .select("onboarding_category")
      .single();
    if (error) return NextResponse.json({ message: "Unable to save your business category." }, { status: 400 });
    return NextResponse.json({ category: profile.onboarding_category });
  } catch {
    return NextResponse.json({ message: "Unable to save onboarding progress." }, { status: 503 });
  }
}
