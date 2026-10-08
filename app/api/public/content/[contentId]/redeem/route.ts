import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<unknown> };

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  if (!params || typeof params !== "object" || typeof (params as { contentId?: unknown }).contentId !== "string") {
    return NextResponse.json({ message: "Invalid offer." }, { status: 400 });
  }
  const contentId = (params as { contentId: string }).contentId;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("issue_content_offer_redemption_nonce", {
    p_content_id: contentId,
  });
  if (error || typeof data !== "string") return NextResponse.json({ message: "This offer is not currently available." }, { status: 400 });
  return NextResponse.json({ nonce: data });
}

export async function POST(request: Request, context: RouteContext) {
  const params = await context.params;
  if (!params || typeof params !== "object" || typeof (params as { contentId?: unknown }).contentId !== "string") {
    return NextResponse.json({ message: "Invalid offer." }, { status: 400 });
  }
  const body = await request.json().catch(() => null) as { offer_code?: unknown; nonce?: unknown } | null;
  if (!body || typeof body.offer_code !== "string" || typeof body.nonce !== "string") {
    return NextResponse.json({ message: "Offer code and redemption token are required." }, { status: 400 });
  }
  const contentId = (params as { contentId: string }).contentId;
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("record_content_offer_redemption", {
    p_content_id: contentId,
    p_offer_code: body.offer_code,
    p_nonce: body.nonce,
  });
  if (error) {
    const message = error.message.includes("already used") || error.message.includes("invalid")
      ? "This redemption has already been used or is no longer valid."
      : error.message.includes("code")
        ? "Enter a valid offer code."
        : "This offer is not currently available.";
    return NextResponse.json({ message }, { status: 400 });
  }
  return NextResponse.json({ redeemed: true });
}
