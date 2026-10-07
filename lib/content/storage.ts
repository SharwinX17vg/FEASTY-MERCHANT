export const CONTENT_IMAGE_BUCKET = "merchant-content-images";
export const MAX_CONTENT_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

export type ContentImageValidation =
  | { valid: true; extension: keyof typeof ALLOWED_IMAGES; mimeType: string }
  | { valid: false; error: string };

function extensionOf(filename: string) {
  const match = /\.([a-z0-9]+)$/i.exec(filename.trim());
  return match?.[1].toLowerCase() as keyof typeof ALLOWED_IMAGES | undefined;
}

function hasExpectedSignature(extension: keyof typeof ALLOWED_IMAGES, content: Uint8Array) {
  if (extension === "png") return content.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => content[index] === value);
  if (extension === "jpg" || extension === "jpeg") return content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff;
  return content.length >= 12 &&
    new TextDecoder().decode(content.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(content.slice(8, 12)) === "WEBP";
}

export function validateContentImage(
  filename: string,
  mimeType: string,
  size: number,
  content?: Uint8Array,
): ContentImageValidation {
  if (!filename || filename.length > 255 || filename.includes("..") || /[\\/]/.test(filename)) {
    return { valid: false, error: "Use a safe image filename without path characters." };
  }
  const extension = extensionOf(filename);
  const normalizedMimeType = mimeType.trim().toLowerCase();
  if (!extension || !ALLOWED_IMAGES[extension] || ALLOWED_IMAGES[extension] !== normalizedMimeType) {
    return { valid: false, error: "Only JPG, PNG, and WEBP images are accepted." };
  }
  if (!Number.isInteger(size) || size <= 0 || size > MAX_CONTENT_IMAGE_SIZE) {
    return { valid: false, error: "Content images must be smaller than 5 MB." };
  }
  if (content && !hasExpectedSignature(extension, content)) {
    return { valid: false, error: "The image content does not match its file type." };
  }
  return { valid: true, extension, mimeType: normalizedMimeType };
}

export function createContentImagePath(businessId: string, contentId: string, extension: keyof typeof ALLOWED_IMAGES) {
  const path = `${businessId}/${contentId}.${extension}`;
  if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i.test(path)) {
    throw new Error("Unable to create a safe content image path.");
  }
  return path;
}
