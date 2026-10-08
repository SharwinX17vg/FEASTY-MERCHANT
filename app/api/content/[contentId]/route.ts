import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getValidatedWorkspaceContext } from "@/lib/workspace/context";
import { validateContent } from "@/lib/validation/content";
import { CONTENT_IMAGE_BUCKET, createContentImagePath, validateContentImage } from "@/lib/content/storage";
import { getContentEditAuditAction, recordContentAudit } from "@/lib/content/audit";

type RouteContext = { params: Promise<{ contentId: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const result = await getValidatedWorkspaceContext();
  if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
  if (!result.data.businessId || !result.data.canManageBusiness) {
    return NextResponse.json({ message: "You do not have permission to edit content." }, { status: 403 });
  }
  const { contentId } = await context.params;
  const supabase = await getSupabaseServerClient();
  const { data: item } = await supabase
    .from("merchant_content")
    .select("id,business_id,publication_status,publish_at")
    .eq("id", contentId)
    .eq("business_id", result.data.businessId)
    .maybeSingle();
  if (!item) return NextResponse.json({ message: "Content not found." }, { status: 404 });
  if (!["draft", "rejected"].includes(item.publication_status)) {
    return NextResponse.json({ message: "Only draft or rejected content can be edited." }, { status: 409 });
  }
  const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data") ?? false;
  const formData = isMultipart ? await request.formData() : null;
  const input = formData
    ? Object.fromEntries(formData.entries()) as Record<string, unknown>
    : (await request.json()) as Record<string, unknown>;
  const removeImage = input.remove_image === "true";
  const file = formData?.get("image");
  const validation = validateContent(input);
  if (Object.keys(validation.errors).length > 0) {
    return NextResponse.json({ errors: validation.errors, message: "Review the highlighted fields." }, { status: 400 });
  }
  let imagePath = (await supabase.from("merchant_content").select("image_path").eq("id", contentId).single()).data?.image_path ?? null;
  if (file instanceof File && file.size > 0) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const imageValidation = validateContentImage(file.name, file.type, file.size, bytes);
    if (!imageValidation.valid) return NextResponse.json({ message: imageValidation.error }, { status: 400 });
    const nextImagePath = createContentImagePath(result.data.businessId, contentId, imageValidation.extension);
    const upload = await supabase.storage.from(CONTENT_IMAGE_BUCKET).upload(nextImagePath, file, {
      contentType: imageValidation.mimeType,
      upsert: true,
    });
    if (upload.error) return NextResponse.json({ message: "Unable to store the content image." }, { status: 400 });
    if (imagePath && imagePath !== nextImagePath) await supabase.storage.from(CONTENT_IMAGE_BUCKET).remove([imagePath]);
    imagePath = nextImagePath;
  } else if (removeImage && imagePath) {
    await supabase.storage.from(CONTENT_IMAGE_BUCKET).remove([imagePath]);
    imagePath = null;
  }
  const { data, error } = await supabase
    .from("merchant_content")
    .update({ ...validation.values, image_path: imagePath })
    .eq("id", contentId)
    .eq("business_id", result.data.businessId)
    .select("*")
    .single();
  if (error || !data) return NextResponse.json({ message: "Unable to update content." }, { status: 400 });
  const auditError = await recordContentAudit(supabase, {
    action: getContentEditAuditAction(item.publish_at, data.publish_at),
    actor_id: result.data.user.id,
    business_id: result.data.businessId,
    content_id: contentId,
    from_status: item.publication_status,
    to_status: data.publication_status,
  });
  if (auditError) return NextResponse.json({ message: "Content was updated, but audit history could not be recorded." }, { status: 503 });
  return NextResponse.json({
    item: {
      ...data,
      image_url: imagePath ? supabase.storage.from(CONTENT_IMAGE_BUCKET).getPublicUrl(imagePath).data.publicUrl : null,
    },
    message: "Content updated.",
  });
}
