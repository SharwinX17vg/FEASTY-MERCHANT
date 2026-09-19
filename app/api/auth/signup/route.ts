import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { normalizePhone, validateSignupInput } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
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
      return NextResponse.json(
        { message: "Unable to create your account. Check your details and try again." },
        { status: 400 },
      );
    }

    return NextResponse.json({ confirmed: Boolean(data.session) });
  } catch {
    return NextResponse.json(
      { message: "The signup service is unavailable. Please try again later." },
      { status: 503 },
    );
  }
}
