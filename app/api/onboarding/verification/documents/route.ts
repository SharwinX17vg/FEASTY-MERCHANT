import { NextResponse } from "next/server";

import {
  createVerificationStoragePath,
  VERIFICATION_DOCUMENT_BUCKET,
  validateVerificationDocument,
} from "@/lib/verification/storage";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let storagePath: string | undefined;
  try {
    const supabase = await getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return NextResponse.json({ message: "Sign in required." }, { status: 401 });

    const formData = await request.formData();
    const verificationRequestId = formData.get("verificationRequestId");
    const file = formData.get("file");
    if (typeof verificationRequestId !== "string" || !(file instanceof File)) {
      return NextResponse.json({ message: "Choose a document to upload." }, { status: 400 });
    }

    const { data: verification } = await supabase
      .from("verification_requests")
      .select("id,organization_id,business_id,status")
      .eq("id", verificationRequestId)
      .maybeSingle();
    if (!verification || ["approved", "rejected", "withdrawn"].includes(verification.status)) {
      return NextResponse.json({ message: "This verification request is not available." }, { status: 403 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const validation = validateVerificationDocument(file.name, file.type, file.size, bytes);
    if (!validation.valid) return NextResponse.json({ message: validation.error }, { status: 400 });

    const operationId = request.headers.get("idempotency-key");
    const documentId = operationId && /^[0-9a-f-]{36}$/i.test(operationId) ? operationId : crypto.randomUUID();
    const existingDocument = await supabase
      .from("verification_documents")
      .select("id,original_filename,mime_type,file_size_bytes,created_at")
      .eq("id", documentId)
      .maybeSingle();
    if (existingDocument.data) return NextResponse.json(existingDocument.data, { status: 200 });
    storagePath = createVerificationStoragePath(
      verification.organization_id,
      verification.business_id,
      verification.id,
      documentId,
      validation.extension,
    );

    const upload = await supabase.storage
      .from(VERIFICATION_DOCUMENT_BUCKET)
      .upload(storagePath, file, { contentType: validation.mimeType, upsert: false });
    if (upload.error) return NextResponse.json({ message: "Unable to store the document." }, { status: 400 });

    const document = await supabase
      .from("verification_documents")
      .insert({
        id: documentId,
        verification_request_id: verification.id,
        uploaded_by: authData.user.id,
        storage_path: storagePath,
        document_type: "verification",
        original_filename: file.name,
        mime_type: validation.mimeType,
        file_size_bytes: file.size,
      })
      .select("id,original_filename,mime_type,file_size_bytes,created_at")
      .single();
    if (document.error) {
      await supabase.storage.from(VERIFICATION_DOCUMENT_BUCKET).remove([storagePath]);
      storagePath = undefined;
      return NextResponse.json({ message: "Unable to record the uploaded document." }, { status: 400 });
    }

    return NextResponse.json(document.data, { status: 201 });
  } catch {
    if (storagePath) {
      const supabase = await getSupabaseServerClient();
      await supabase.storage.from(VERIFICATION_DOCUMENT_BUCKET).remove([storagePath]);
    }
    return NextResponse.json({ message: "Unable to upload the document." }, { status: 503 });
  }
}
