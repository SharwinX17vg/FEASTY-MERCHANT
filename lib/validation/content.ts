export const contentTypes = ["post", "offer"] as const;
export type ContentType = (typeof contentTypes)[number];

export type ContentInput = {
  content_type?: unknown;
  title?: unknown;
  body?: unknown;
  starts_at?: unknown;
  ends_at?: unknown;
  publish_at?: unknown;
  original_price?: unknown;
  offer_price?: unknown;
  discount_percentage?: unknown;
  offer_code?: unknown;
};

export type ContentValues = {
  content_type: ContentType;
  title: string;
  body: string;
  starts_at: string | null;
  ends_at: string | null;
  publish_at: string | null;
  original_price: number | null;
  offer_price: number | null;
  discount_percentage: number | null;
  offer_code: string | null;
};

export function validateContent(input: ContentInput) {
  const contentType = String(input.content_type ?? "").trim();
  const values = {
    content_type: contentType as ContentType,
    title: String(input.title ?? "").trim(),
    body: String(input.body ?? "").trim(),
    starts_at: String(input.starts_at ?? "").trim() || null,
    ends_at: String(input.ends_at ?? "").trim() || null,
    publish_at: String(input.publish_at ?? "").trim() || null,
    original_price: input.original_price === undefined || String(input.original_price).trim() === "" ? null : Number(input.original_price),
    offer_price: input.offer_price === undefined || String(input.offer_price).trim() === "" ? null : Number(input.offer_price),
    discount_percentage: input.discount_percentage === undefined || String(input.discount_percentage).trim() === "" ? null : Number(input.discount_percentage),
    offer_code: String(input.offer_code ?? "").trim() || null,
  } satisfies ContentValues;
  const errors: Partial<Record<keyof ContentValues, string>> = {};

  if (!contentTypes.includes(values.content_type)) {
    errors.content_type = "Choose a valid content type.";
  }
  if (values.title.length < 2 || values.title.length > 160) {
    errors.title = "Title must be between 2 and 160 characters.";
  }
  if (!values.body || values.body.length > 5000) {
    errors.body = "Content must be between 1 and 5,000 characters.";
  }

  const startsAt = values.starts_at ? Date.parse(values.starts_at) : null;
  const endsAt = values.ends_at ? Date.parse(values.ends_at) : null;
  const publishAt = values.publish_at ? Date.parse(values.publish_at) : null;
  if (values.starts_at && startsAt === null) errors.starts_at = "Enter a valid start date.";
  if (values.ends_at && endsAt === null) errors.ends_at = "Enter a valid end date.";
  if (values.publish_at && publishAt === null) errors.publish_at = "Enter a valid publish date.";
  if (startsAt !== null && endsAt !== null && startsAt >= endsAt) {
    errors.ends_at = "End date must be after the start date.";
  }
  if (publishAt !== null && endsAt !== null && publishAt >= endsAt) {
    errors.publish_at = "Publish date must be before the end date.";
  }

  if (values.content_type === "post") {
    values.original_price = null;
    values.offer_price = null;
    values.discount_percentage = null;
    values.offer_code = null;
  } else {
    if (values.original_price !== null && (!Number.isFinite(values.original_price) || values.original_price <= 0)) {
      errors.original_price = "Original price must be greater than 0.";
    }
    if (values.offer_price !== null && (!Number.isFinite(values.offer_price) || values.offer_price < 0)) {
      errors.offer_price = "Offer price must be 0 or greater.";
    }
    if (values.original_price !== null && values.offer_price !== null && values.offer_price > values.original_price) {
      errors.offer_price = "Offer price cannot be greater than the original price.";
    }
    if (values.discount_percentage !== null && (!Number.isFinite(values.discount_percentage) || values.discount_percentage < 0 || values.discount_percentage > 100)) {
      errors.discount_percentage = "Discount must be between 0 and 100.";
    }
    if (values.offer_code !== null && (values.offer_code.length < 1 || values.offer_code.length > 50)) {
      errors.offer_code = "Offer code must be 1 to 50 characters.";
    }
  }

  return { errors, values };
}

export function validateRejectionReason(value: unknown) {
  const reason = String(value ?? "").trim();
  return reason.length >= 2 && reason.length <= 1000
    ? { reason }
    : { error: "Enter a rejection reason between 2 and 1,000 characters." };
}
