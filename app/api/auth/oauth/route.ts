import { NextResponse } from "next/server";

import { getSiteUrl, getSupabaseEnvironment } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAuthRouteFailure,
  getGoogleProviderErrorMessage,
  getSupabaseAuthErrorDetails,
} from "@/lib/auth/route-errors";

export async function POST() {
  try {
    getSupabaseEnvironment();
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${getSiteUrl()}/auth/callback?next=/dashboard` },
    });
    if (error || !data.url) {
      const details = getSupabaseAuthErrorDetails(error);
      console.warn("Supabase Google OAuth request was rejected.", details);
      return NextResponse.json(
        {
          message: getGoogleProviderErrorMessage(
            details.code,
            error instanceof Error ? error.message : undefined,
          ),
        },
        { status: details.status ?? 503 },
      );
    }
    return NextResponse.json({ url: data.url });
  } catch (error) {
    const failure = getAuthRouteFailure(error, "Google sign-in is unavailable.");
    return NextResponse.json({ message: failure.message }, { status: failure.status });
  }
}
