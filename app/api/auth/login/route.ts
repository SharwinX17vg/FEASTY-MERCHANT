import { NextResponse } from "next/server";

import { getSupabaseEnvironment } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAuthRouteFailure,
  getLoginProviderErrorMessage,
  getSupabaseAuthErrorDetails,
} from "@/lib/auth/route-errors";
import { validateLoginInput } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    getSupabaseEnvironment();
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
      const details = getSupabaseAuthErrorDetails(error);
      console.warn(
        "Supabase login request was rejected.",
        JSON.stringify({ name: error.name, status: error.status, code: error.code }),
      );
      return NextResponse.json(
        { message: getLoginProviderErrorMessage(details.code) },
        { status: details.status ?? 401 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const failure = getAuthRouteFailure(error, "The login service is unavailable. Please try again later.");
    return NextResponse.json({ message: failure.message }, { status: failure.status });
  }
}
