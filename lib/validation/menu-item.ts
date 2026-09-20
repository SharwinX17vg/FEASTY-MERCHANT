export type MenuItemInput = {
  name?: unknown;
  description?: unknown;
  category?: unknown;
  price?: unknown;
  is_available?: unknown;
};

export type MenuItemValues = {
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  is_available: boolean;
};

export type MenuItemValidation = {
  errors: Partial<Record<keyof MenuItemValues, string>>;
  values: MenuItemValues;
};

function textValue(value: unknown) {
  return String(value ?? "").trim();
}

export function validateMenuItem(input: MenuItemInput): MenuItemValidation {
  const rawPrice = textValue(input.price);
  const parsedPrice = Number(rawPrice);
  const values: MenuItemValues = {
    name: textValue(input.name),
    description: textValue(input.description) || null,
    category: textValue(input.category) || null,
    price: Number.isFinite(parsedPrice) ? Math.round(parsedPrice * 100) / 100 : 0,
    is_available: input.is_available !== false,
  };
  const errors: MenuItemValidation["errors"] = {};

  if (values.name.length < 2 || values.name.length > 160) {
    errors.name = "Item name must be between 2 and 160 characters.";
  }
  if (values.description && values.description.length > 2000) {
    errors.description = "Description must be 2,000 characters or fewer.";
  }
  if (values.category && values.category.length > 80) {
    errors.category = "Category must be 80 characters or fewer.";
  }
  if (!rawPrice || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
    errors.price = "Enter a valid non-negative price.";
  } else if (!/^\d+(\.\d{1,2})?$/.test(rawPrice)) {
    errors.price = "Price can have at most two decimal places.";
  } else if (parsedPrice > 99999999.99) {
    errors.price = "Price is too large.";
  }

  return { errors, values };
}
