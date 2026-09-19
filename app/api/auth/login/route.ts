import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { validateLoginInput } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as Record<string, unknown>;
    const validation = validateLoginInput(input);
    if (Object.keys(validation.errors).length > 0) {
      return NextResponse.json({ message: "Enter a valid email and password." }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: validation.email,
      password: validation.password,
    });
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
