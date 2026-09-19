export const VERIFICATION_DOCUMENT_BUCKET = "verification-documents";
export const MAX_VERIFICATION_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_DOCUMENTS = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

export type VerificationDocumentValidation =
  | { valid: true; extension: keyof typeof ALLOWED_DOCUMENTS; mimeType: string }
  | { valid: false; error: string };

function extensionOf(filename: string) {
  const match = /\.([a-z0-9]+)$/i.exec(filename.trim());
  return match?.[1].toLowerCase() as keyof typeof ALLOWED_DOCUMENTS | undefined;
}

export function validateVerificationDocument(
  filename: string,
  mimeType: string,
  size: number,
  content?: Uint8Array,
): VerificationDocumentValidation {
  if (!filename || filename.length > 255 || filename.includes("..") || /[\\/]/.test(filename)) {
    return { valid: false, error: "Use a safe document filename without path characters." };
  }

  const extension = extensionOf(filename);
  const normalizedMimeType = mimeType.trim().toLowerCase();
  if (!extension || !ALLOWED_DOCUMENTS[extension] || ALLOWED_DOCUMENTS[extension] !== normalizedMimeType) {
    return { valid: false, error: "Only PDF, JPG, PNG, and WEBP documents are accepted." };
  }
  if (!Number.isInteger(size) || size <= 0 || size > MAX_VERIFICATION_FILE_SIZE) {
    return { valid: false, error: "Verification documents must be smaller than 10 MB." };
  }
  if (content && !hasExpectedSignature(extension, content)) {
    return { valid: false, error: "The document content does not match its file type." };
  }

  return { valid: true, extension, mimeType: normalizedMimeType };
}

function hasExpectedSignature(extension: keyof typeof ALLOWED_DOCUMENTS, content: Uint8Array) {
  if (extension === "pdf") return new TextDecoder().decode(content.slice(0, 5)) === "%PDF-";
  if (extension === "png") return content.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => content[index] === value);
  if (extension === "jpg" || extension === "jpeg") return content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff;
  return content.length >= 12 &&
    new TextDecoder().decode(content.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(content.slice(8, 12)) === "WEBP";
}

export function isSafeVerificationStoragePath(path: string) {
  return /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(pdf|jpg|jpeg|png|webp)$/i.test(path);
}

export function createVerificationStoragePath(
  organizationId: string,
  businessId: string,
  verificationRequestId: string,
  documentId: string,
  extension: keyof typeof ALLOWED_DOCUMENTS,
) {
  const path = `${organizationId}/${businessId}/${verificationRequestId}/${documentId}.${extension}`;
  if (!isSafeVerificationStoragePath(path)) throw new Error("Unable to create a safe storage path.");
  return path;
}
