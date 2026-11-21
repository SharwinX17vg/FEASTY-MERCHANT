import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthRouteFailure } from "@/lib/auth/route-errors";
import {
  getInvalidJsonBodyResponse,
  readJsonObject,
} from "@/lib/http/request";

export async function POST(request: Request) {
  try {
    const input = await readJsonObject(request) as { email?: string };
    const email = String(input.email ?? "").trim().toLowerCase();
    if (!email) return NextResponse.json({ message: "Enter your email address." }, { status: 400 });

    const supabase = await getSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/reset-password`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const invalidBody = getInvalidJsonBodyResponse(error);
    if (invalidBody) return invalidBody;
    const failure = getAuthRouteFailure(error, "Unable to send a reset email.");
    return NextResponse.json({ message: failure.message }, { status: failure.status });
  }
}
