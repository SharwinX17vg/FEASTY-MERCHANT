import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as Record<string, unknown>;
    const email = String(input.email ?? "").trim().toLowerCase();
    const password = String(input.password ?? "");
    if (!email || !password) {
      return NextResponse.json({ message: "Enter your email and password." }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ message: "Email or password is incorrect." }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { message: "The login service is unavailable. Please try again later." },
      { status: 503 },
    );
  }
}
