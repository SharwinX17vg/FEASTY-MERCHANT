import { NextResponse } from "next/server";

import {
  SupabaseConfigurationError,
  getSiteUrl,
  getSupabaseEnvironment,
} from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAuthRouteFailure,
  getSignupProviderErrorMessage,
  getSupabaseAuthErrorDetails,
} from "@/lib/auth/route-errors";
import { normalizePhone, validateSignupInput } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    getSupabaseEnvironment();
    const input = (await request.json()) as Record<string, unknown>;
    const validation = validateSignupInput(input);
    if (Object.keys(validation.errors).length > 0) {
      return NextResponse.json({ errors: validation.errors }, { status: 400 });
    }

    const phone = normalizePhone(validation.phone, validation.country);
    if (phone.error) {
      return NextResponse.json({ errors: { phone: phone.error } }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: validation.email,
      password: String(input.password),
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/dashboard`,
        data: {
          display_name: validation.name,
          country: validation.country,
          phone: phone.e164,
        },
      },
    });

    if (error) {
      const details = getSupabaseAuthErrorDetails(error);
      console.warn(
        "Supabase signup request was rejected.",
        JSON.stringify({
          name: error.name,
          message: error.message,
          status: error.status,
          code: error.code,
        }),
      );
      return NextResponse.json({ message: getSignupProviderErrorMessage(details.code) }, {
        status: details.status ?? 400,
      });
    }

    return NextResponse.json({ confirmed: Boolean(data.session) });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      const failure = getAuthRouteFailure(error, "The signup service is unavailable. Please try again later.");
      return NextResponse.json({ message: failure.message }, { status: failure.status });
    }

    const failure = getAuthRouteFailure(error, "The signup service is unavailable. Please try again later.");
    return NextResponse.json({ message: failure.message }, { status: failure.status });
  }
}
