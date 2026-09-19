import assert from "node:assert/strict";
import test from "node:test";

import { getSafeNextPath } from "../lib/auth/redirect.ts";
import {
  detectPhoneCountry,
  getPasswordRequirements,
  getPasswordStrength,
  normalizeEmail,
  normalizePhone,
  reformatPhone,
  validatePassword,
  validateSignupInput,
} from "../lib/validation/auth.ts";

test("email normalization trims whitespace and lowercases addresses", () => {
  assert.equal(normalizeEmail("  Merchant@Example.COM "), "merchant@example.com");
  assert.equal(normalizeEmail(null), "");
});

test("safe redirect handling allows internal paths and rejects external paths", () => {
  assert.equal(getSafeNextPath("/dashboard"), "/dashboard");
  assert.equal(getSafeNextPath("/register/business?step=2"), "/register/business?step=2");
  assert.equal(getSafeNextPath("//example.com"), "/dashboard");
  assert.equal(getSafeNextPath("https://example.com"), "/dashboard");
  assert.equal(getSafeNextPath(null, "/login"), "/login");
});

test("password validation rejects passwords missing each required strength rule", () => {
  assert.equal(validatePassword("short"), "Use at least 8 characters.");
  assert.equal(validatePassword("longpassword"), "Include at least one uppercase letter.");
  assert.equal(validatePassword("LONGPASSWORD1!"), "Include at least one lowercase letter.");
  assert.equal(validatePassword("Longpassword"), "Include at least one number.");
  assert.equal(validatePassword("Longpassword1"), "Include at least one symbol.");
});

test("password validation accepts a strong password", () => {
  assert.equal(validatePassword("Longpassword1!"), undefined);
});

test("password feedback uses the same requirements as validation", () => {
  assert.deepEqual(
    getPasswordRequirements("Longpassword1!").map(({ id, met }) => ({ id, met })),
    [
      { id: "length", met: true },
      { id: "uppercase", met: true },
      { id: "lowercase", met: true },
      { id: "number", met: true },
      { id: "symbol", met: true },
    ],
  );
  assert.deepEqual(getPasswordStrength("weak"), { score: 1, label: "Weak" });
  assert.deepEqual(getPasswordStrength("Longpassword1"), { score: 4, label: "Fair" });
  assert.deepEqual(getPasswordStrength("Longpassword1!"), { score: 5, label: "Strong" });
});

test("normalizes a valid Indian phone number to E.164", () => {
  assert.deepEqual(normalizePhone("9876543210", "IN"), { e164: "+919876543210" });
});

test("accepts an Indian number pasted with the +91 country code", () => {
  assert.deepEqual(normalizePhone("+919876543210", "IN"), { e164: "+919876543210" });
});

test("accepts an Indian national number without the country code", () => {
  assert.deepEqual(normalizePhone("9876543210", "IN"), { e164: "+919876543210" });
});

test("rejects an invalid Indian phone number", () => {
  assert.deepEqual(normalizePhone("12345", "IN"), {
    error: "Enter a valid phone number for the selected country.",
  });
});

test("rejects a phone number that does not match the selected country", () => {
  assert.deepEqual(normalizePhone("+14155552671", "IN"), {
    error: "Enter a valid phone number for the selected country.",
  });
});

test("normalizes an international phone number to E.164", () => {
  assert.deepEqual(normalizePhone("+14155552671", "US"), { e164: "+14155552671" });
});

test("reformats the entered national number when the country changes", () => {
  assert.equal(reformatPhone("98765 43210", "IN", "US"), "(987) 654-3210");
});

test("detects the country from an international paste", () => {
  assert.equal(detectPhoneCountry("+919876543210"), "IN");
  assert.equal(detectPhoneCountry("9876543210"), undefined);
});

const validSignupInput = {
  name: "Asha Merchant",
  email: "  ASHA@EXAMPLE.COM ",
  country: "IN",
  phone: "9876543210",
  password: "StrongPassword1!",
  confirmPassword: "StrongPassword1!",
  termsAccepted: true,
};

test("signup validation reports a missing name", () => {
  const result = validateSignupInput({ ...validSignupInput, name: "" });
  assert.equal(result.errors.name, "Enter your full name.");
});

test("signup validation reports an invalid email", () => {
  const result = validateSignupInput({ ...validSignupInput, email: "not-an-email" });
  assert.equal(result.errors.email, "Enter a valid email address.");
});

test("signup validation reports an invalid country", () => {
  const result = validateSignupInput({ ...validSignupInput, country: "ZZ" });
  assert.equal(result.errors.country, "Select a valid country.");
});

test("signup validation reports an invalid phone", () => {
  const result = validateSignupInput({ ...validSignupInput, phone: "12345" });
  assert.equal(result.errors.phone, "Enter a valid phone number for the selected country.");
});

test("signup validation reports a weak password", () => {
  const result = validateSignupInput({ ...validSignupInput, password: "weak" });
  assert.equal(result.errors.password, "Use at least 8 characters.");
});

test("signup validation reports a password mismatch", () => {
  const result = validateSignupInput({
    ...validSignupInput,
    confirmPassword: "DifferentPassword1!",
  });
  assert.equal(result.errors.confirmPassword, "Passwords do not match.");
});

test("signup validation reports terms that were not accepted", () => {
  const result = validateSignupInput({ ...validSignupInput, termsAccepted: false });
  assert.equal(result.errors.terms, "Accept the Terms & Privacy Policy to continue.");
});

test("signup validation accepts valid input without errors", () => {
  const result = validateSignupInput(validSignupInput);
  assert.deepEqual(result.errors, {});
  assert.equal(result.email, "asha@example.com");
  assert.equal(result.name, "Asha Merchant");
  assert.equal(result.country, "IN");
});
