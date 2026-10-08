import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { validateContentAnalyticsEvent } from "@/lib/validation/contentAnalytics";

type RouteContext = { params: Promise<{ contentId: string }> };

export async function POST(request: Request, context: RouteContext) {
  let input: unknown;
  try {
    input = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid analytics event." }, { status: 400 });
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return NextResponse.json({ message: "Invalid analytics event." }, { status: 400 });
  }
  const validation = validateContentAnalyticsEvent((input as { event_type?: unknown }).event_type);
  if ("error" in validation) return NextResponse.json({ message: validation.error }, { status: 400 });

  const { contentId } = await context.params;
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("record_content_analytics_event", {
    p_content_id: contentId,
    p_event_type: validation.eventType,
  });
  if (error) return NextResponse.json({ message: "Unable to record analytics event." }, { status: 400 });
  return NextResponse.json({ recorded: true });
}
