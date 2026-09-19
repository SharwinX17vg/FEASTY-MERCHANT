import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const input = (await request.json()) as { password?: string; confirmPassword?: string };
  const password = String(input.password ?? "");
  const passwordError = validatePassword(password);
  if (passwordError || password !== input.confirmPassword) {
    return NextResponse.json(
      { message: passwordError ?? "Passwords do not match." },
      { status: 400 },
    );
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return NextResponse.json({ message: "This recovery link is invalid or expired." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Unable to reset your password." }, { status: 503 });
  }
}
