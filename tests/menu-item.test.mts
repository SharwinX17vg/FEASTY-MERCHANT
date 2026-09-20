import assert from "node:assert/strict";
import test from "node:test";

import { validateMenuItem } from "../lib/validation/menu-item.ts";

test("normalizes a valid menu item", () => {
  const result = validateMenuItem({
    name: "  Masala Dosa ",
    description: "Crisp dosa with chutney",
    category: "Breakfast",
    price: "129.50",
    is_available: true,
  });

  assert.deepEqual(result.errors, {});
  assert.equal(result.values.name, "Masala Dosa");
  assert.equal(result.values.price, 129.5);
});

test("rejects empty names and invalid prices", () => {
  const empty = validateMenuItem({ name: "", price: "" });
  const invalid = validateMenuItem({ name: "Dish", price: "12.999" });

  assert.equal(empty.errors.name, "Item name must be between 2 and 160 characters.");
  assert.equal(empty.errors.price, "Enter a valid non-negative price.");
  assert.equal(invalid.errors.price, "Price can have at most two decimal places.");
});

test("preserves availability updates", () => {
  const result = validateMenuItem({ name: "Dish", price: 50, is_available: false });
  assert.equal(result.errors.name, undefined);
  assert.equal(result.values.is_available, false);
});
