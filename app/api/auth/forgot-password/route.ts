import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as { email?: string };
    const email = String(input.email ?? "").trim().toLowerCase();
    if (!email) return NextResponse.json({ message: "Enter your email address." }, { status: 400 });

    const supabase = await getSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/reset-password`,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Unable to send a reset email." }, { status: 503 });
  }
}
