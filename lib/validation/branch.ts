export type BranchInput = {
  name?: unknown;
  address_line_1?: unknown;
  address_line_2?: unknown;
  city?: unknown;
  state?: unknown;
  postal_code?: unknown;
  country_code?: unknown;
  phone?: unknown;
};

export type BranchValues = {
  name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country_code: string;
  phone: string | null;
};

export type BranchValidation = {
  errors: Partial<Record<keyof BranchValues, string>>;
  values: BranchValues;
};

function textValue(value: unknown) {
  return String(value ?? "").trim();
}

export function validateBranch(input: BranchInput): BranchValidation {
  const values: BranchValues = {
    name: textValue(input.name),
    address_line_1: textValue(input.address_line_1),
    address_line_2: textValue(input.address_line_2) || null,
    city: textValue(input.city),
    state: textValue(input.state) || null,
    postal_code: textValue(input.postal_code) || null,
    country_code: textValue(input.country_code).toUpperCase(),
    phone: textValue(input.phone) || null,
  };
  const errors: BranchValidation["errors"] = {};

  if (values.name.length < 2 || values.name.length > 160) {
    errors.name = "Location name must be between 2 and 160 characters.";
  }
  if (!values.address_line_1 || values.address_line_1.length > 240) {
    errors.address_line_1 = "Enter an address of 240 characters or fewer.";
  }
  if (values.address_line_2 && values.address_line_2.length > 240) {
    errors.address_line_2 = "Address line 2 must be 240 characters or fewer.";
  }
  if (values.city.length < 2 || values.city.length > 120) {
    errors.city = "City must be between 2 and 120 characters.";
  }
  if (values.state && values.state.length > 120) {
    errors.state = "State or region must be 120 characters or fewer.";
  }
  if (values.postal_code && values.postal_code.length > 30) {
    errors.postal_code = "Postal code must be 30 characters or fewer.";
  }
  if (!/^[A-Z]{2}$/.test(values.country_code)) {
    errors.country_code = "Use a two-letter country code, such as IN.";
  }
  if (values.phone && values.phone.length > 40) {
    errors.phone = "Phone number must be 40 characters or fewer.";
  }

  return { errors, values };
}
