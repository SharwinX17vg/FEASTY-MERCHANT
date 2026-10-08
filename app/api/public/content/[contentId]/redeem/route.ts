import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<unknown> };

export async function POST(_request: Request, context: RouteContext) {
  const params = await context.params;
  if (!params || typeof params !== "object" || typeof (params as { contentId?: unknown }).contentId !== "string") {
    return NextResponse.json({ message: "Invalid offer." }, { status: 400 });
  }
  const contentId = (params as { contentId: string }).contentId;
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("record_content_offer_redemption", {
    p_content_id: contentId,
  });
  if (error) return NextResponse.json({ message: "This offer is not currently available." }, { status: 400 });
  return NextResponse.json({ redeemed: true });
}
