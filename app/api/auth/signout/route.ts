import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthRouteFailure } from "@/lib/auth/route-errors";

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const failure = getAuthRouteFailure(error, "Unable to sign out right now. Please try again.");
    return NextResponse.json({ message: failure.message }, { status: failure.status });
  }
}
