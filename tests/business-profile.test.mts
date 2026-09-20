import test from "node:test";
import assert from "node:assert/strict";

import { validateBusinessProfile } from "../lib/validation/business-profile.ts";

test("validates and normalizes editable business profile fields", () => {
  const result = validateBusinessProfile({
    name: "  The Feast  ",
    category: "Restaurant",
    email: " OWNER@EXAMPLE.COM ",
    website_url: "https://example.com",
  });

  assert.deepEqual(result.errors, {});
  assert.equal(result.values.name, "The Feast");
  assert.equal(result.values.email, "owner@example.com");
});

test("rejects invalid profile values", () => {
  const result = validateBusinessProfile({
    name: "x",
    category: "",
    email: "not-an-email",
    website_url: "javascript:alert(1)",
  });

  assert.equal(result.errors.name, "Business name must be between 2 and 160 characters.");
  assert.equal(result.errors.category, "Category must be between 2 and 80 characters.");
  assert.equal(result.errors.email, "Enter a valid email address.");
  assert.equal(result.errors.website_url, "Enter a valid website URL, including https://.");
});
