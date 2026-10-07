export const contentTypes = ["post", "offer"] as const;
export type ContentType = (typeof contentTypes)[number];

export type ContentInput = {
  content_type?: unknown;
  title?: unknown;
  body?: unknown;
  starts_at?: unknown;
  ends_at?: unknown;
};

export type ContentValues = {
  content_type: ContentType;
  title: string;
  body: string;
  starts_at: string | null;
  ends_at: string | null;
};

export function validateContent(input: ContentInput) {
  const contentType = String(input.content_type ?? "").trim();
  const values = {
    content_type: contentType as ContentType,
    title: String(input.title ?? "").trim(),
    body: String(input.body ?? "").trim(),
    starts_at: String(input.starts_at ?? "").trim() || null,
    ends_at: String(input.ends_at ?? "").trim() || null,
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
  if (values.starts_at && startsAt === null) errors.starts_at = "Enter a valid start date.";
  if (values.ends_at && endsAt === null) errors.ends_at = "Enter a valid end date.";
  if (startsAt !== null && endsAt !== null && startsAt >= endsAt) {
    errors.ends_at = "End date must be after the start date.";
  }

  return { errors, values };
}

export function validateRejectionReason(value: unknown) {
  const reason = String(value ?? "").trim();
  return reason.length >= 2 && reason.length <= 1000
    ? { reason }
    : { error: "Enter a rejection reason between 2 and 1,000 characters." };
}
