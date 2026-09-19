import assert from "node:assert/strict";
import test from "node:test";

import { getSafeNextPath } from "../lib/auth/redirect.ts";
import { normalizeEmail, validatePassword } from "../lib/validation/auth.ts";

test("auth redirects remain internal", () => {
  assert.equal(getSafeNextPath("/dashboard"), "/dashboard");
  assert.equal(getSafeNextPath("//example.com"), "/dashboard");
  assert.equal(getSafeNextPath("https://example.com"), "/dashboard");
});

test("email normalization is deterministic", () => {
  assert.equal(normalizeEmail("  Merchant@Example.COM "), "merchant@example.com");
});

test("password validation rejects weak credentials", () => {
  assert.equal(validatePassword("short"), "Use at least 8 characters.");
  assert.equal(validatePassword("longpassword"), "Include at least one uppercase letter.");
  assert.equal(validatePassword("Longpassword"), "Include at least one number.");
  assert.equal(validatePassword("Longpassword1"), "Include at least one symbol.");
  assert.equal(validatePassword("Longpassword1!"), undefined);
});
