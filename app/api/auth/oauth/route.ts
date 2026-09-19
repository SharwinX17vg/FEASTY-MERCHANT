import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${getSiteUrl()}/auth/callback?next=/dashboard` },
    });
    if (error || !data.url) {
      return NextResponse.json({ message: "Google sign-in is unavailable." }, { status: 503 });
    }
    return NextResponse.json({ url: data.url });
  } catch {
    return NextResponse.json({ message: "Google sign-in is unavailable." }, { status: 503 });
  }
}
