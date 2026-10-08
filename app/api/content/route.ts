import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getValidatedWorkspaceContext } from "@/lib/workspace/context";
import { validateContent } from "@/lib/validation/content";
import { CONTENT_IMAGE_BUCKET, createContentImagePath, validateContentImage } from "@/lib/content/storage";
import { countContentAnalyticsEvents } from "@/lib/validation/contentAnalytics";
import { countContentRedemptions } from "@/lib/validation/contentRedemption";
import { buildContentAnalyticsDashboard } from "@/lib/validation/contentAnalytics";
import { isContentCurrentlyActive } from "@/lib/content/publication";

const contentSelect = "id,business_id,content_type,title,body,starts_at,ends_at,original_price,offer_price,discount_percentage,offer_code,publication_status,rejection_reason,image_path,submitted_at,published_at,created_by,created_at,updated_at";

export async function GET() {
  const result = await getValidatedWorkspaceContext();
  if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
  if (!result.data.businessId) return NextResponse.json({ items: [] });

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("merchant_content")
    .select(contentSelect)
    .eq("business_id", result.data.businessId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ message: "Unable to load content." }, { status: 503 });
  const activePublished = (data ?? []).filter((item) => item.publication_status === "published" && isContentCurrentlyActive(item.starts_at, item.ends_at));
  const publishedIds = activePublished.map((item) => item.id);
  const analytics = publishedIds.length
    ? await supabase
      .from("merchant_content_analytics")
      .select("content_id,event_date,event_type,event_count")
      .in("content_id", publishedIds)
    : { data: [], error: null };
  if (analytics.error) return NextResponse.json({ message: "Unable to load content analytics." }, { status: 503 });
  const analyticsCounts = countContentAnalyticsEvents(analytics.data ?? []);
  const publishedOfferIds = (data ?? [])
    .filter((item) => item.publication_status === "published" && item.content_type === "offer" && item.offer_code)
    .map((item) => item.id);
  const redemptions = publishedOfferIds.length
    ? await supabase
      .from("merchant_content_offer_redemptions")
      .select("content_id,redemption_date,redemption_count")
      .in("content_id", publishedOfferIds)
    : { data: [], error: null };
  if (redemptions.error) return NextResponse.json({ message: "Unable to load offer redemptions." }, { status: 503 });
  const redemptionCounts = countContentRedemptions(redemptions.data ?? []);
  const analyticsDashboard = buildContentAnalyticsDashboard(
    activePublished.map((item) => ({ id: item.id, title: item.title, content_type: item.content_type })),
    analytics.data ?? [],
    redemptions.data ?? [],
  );
  const items = (data ?? []).map((item) => ({
    ...item,
    ...(item.publication_status === "published" ? analyticsCounts[item.id] ?? { view_count: 0, click_count: 0 } : {}),
    ...(item.publication_status === "published" && item.content_type === "offer" && item.offer_code
      ? { redemption_count: redemptionCounts[item.id] ?? 0 }
      : {}),
    image_url: item.image_path
      ? supabase.storage.from(CONTENT_IMAGE_BUCKET).getPublicUrl(item.image_path).data.publicUrl
      : null,
  }));
  return NextResponse.json({ items, analytics: analyticsDashboard });
}

export async function POST(request: Request) {
  const result = await getValidatedWorkspaceContext();
  if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
  if (!result.data.businessId || !result.data.canManageBusiness) {
    return NextResponse.json({ message: "You do not have permission to create content." }, { status: 403 });
  }

  const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data") ?? false;
  const formData = isMultipart ? await request.formData() : null;
  const input = formData
    ? Object.fromEntries(formData.entries()) as Record<string, unknown>
    : (await request.json()) as Record<string, unknown>;
  const file = formData?.get("image");
  const validation = validateContent(input);
  if (Object.keys(validation.errors).length > 0) {
    return NextResponse.json({ errors: validation.errors, message: "Review the highlighted fields." }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase
    .from("merchant_content")
    .insert({ business_id: result.data.businessId, created_by: user.user.id, ...validation.values })
    .select(contentSelect)
    .single();
  if (error || !data) return NextResponse.json({ message: "Unable to save content." }, { status: 400 });
  if (file instanceof File && file.size > 0) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const imageValidation = validateContentImage(file.name, file.type, file.size, bytes);
    if (!imageValidation.valid) {
      await supabase.from("merchant_content").delete().eq("id", data.id);
      return NextResponse.json({ message: imageValidation.error }, { status: 400 });
    }
    const imagePath = createContentImagePath(result.data.businessId, data.id, imageValidation.extension);
    const upload = await supabase.storage.from(CONTENT_IMAGE_BUCKET).upload(imagePath, file, {
      contentType: imageValidation.mimeType,
      upsert: false,
    });
    if (upload.error) {
      await supabase.from("merchant_content").delete().eq("id", data.id);
      return NextResponse.json({ message: "Unable to store the content image." }, { status: 400 });
    }
    const update = await supabase.from("merchant_content").update({ image_path: imagePath }).eq("id", data.id).select(contentSelect).single();
    if (update.error || !update.data) {
      await supabase.storage.from(CONTENT_IMAGE_BUCKET).remove([imagePath]);
      await supabase.from("merchant_content").delete().eq("id", data.id);
      return NextResponse.json({ message: "Unable to record the content image." }, { status: 400 });
    }
    return NextResponse.json({ item: { ...update.data, image_url: supabase.storage.from(CONTENT_IMAGE_BUCKET).getPublicUrl(imagePath).data.publicUrl }, message: "Content created as Draft." }, { status: 201 });
  }
  return NextResponse.json({ item: { ...data, image_url: null }, message: "Content created as Draft." }, { status: 201 });
}
