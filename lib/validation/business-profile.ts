import { normalizeEmail, validateEmail } from "./auth.ts";

export type BusinessProfileInput = {
  name?: unknown;
  category?: unknown;
  description?: unknown;
  email?: unknown;
  phone?: unknown;
  website_url?: unknown;
};

export type BusinessProfileValues = {
  name: string;
  category: string;
  description: string;
  email: string;
  phone: string;
  website_url: string;
};

export type BusinessProfileValidation = {
  errors: Partial<Record<keyof BusinessProfileValues, string>>;
  values: BusinessProfileValues;
};

function textValue(value: unknown) {
  return String(value ?? "").trim();
}

export function validateBusinessProfile(
  input: BusinessProfileInput,
): BusinessProfileValidation {
  const values: BusinessProfileValues = {
    name: textValue(input.name),
    category: textValue(input.category),
    description: textValue(input.description),
    email: normalizeEmail(input.email),
    phone: textValue(input.phone),
    website_url: textValue(input.website_url),
  };
  const errors: BusinessProfileValidation["errors"] = {};

  if (values.name.length < 2 || values.name.length > 160) {
    errors.name = "Business name must be between 2 and 160 characters.";
  }
  if (values.category.length < 2 || values.category.length > 80) {
    errors.category = "Category must be between 2 and 80 characters.";
  }
  if (values.description.length > 2000) {
    errors.description = "Description must be 2,000 characters or fewer.";
  }
  if (values.email) {
    const emailError = validateEmail(values.email);
    if (emailError) errors.email = emailError;
  }
  if (values.phone.length > 40) {
    errors.phone = "Phone number must be 40 characters or fewer.";
  }
  if (values.website_url) {
    try {
      const website = new URL(values.website_url);
      if (!["http:", "https:"].includes(website.protocol)) throw new Error();
    } catch {
      errors.website_url = "Enter a valid website URL, including https://.";
    }
  }

  return { errors, values };
}
