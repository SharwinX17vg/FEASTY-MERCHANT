import assert from "node:assert/strict";
import test from "node:test";

import { getSafeNextPath } from "../lib/auth/redirect.ts";
import {
  getNetworkErrorMessage,
  getSafeAuthError,
  NETWORK_ERROR_MESSAGE,
} from "../lib/auth/errors.ts";
import {
  getOnboardingRoute,
  isOnboardingState,
  ONBOARDING_STATES,
  resolveOnboardingState,
} from "../lib/onboarding/state.ts";
import {
  detectPhoneCountry,
  getPasswordRequirements,
  getPasswordStrength,
  normalizeEmail,
  normalizePhone,
  reformatPhone,
  validatePassword,
  validateEmail,
  validateLoginInput,
  validateSignupInput,
} from "../lib/validation/auth.ts";
import {
  createVerificationStoragePath,
  isSafeVerificationStoragePath,
  MAX_VERIFICATION_FILE_SIZE,
  validateVerificationDocument,
} from "../lib/verification/storage.ts";

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

test("auth errors are mapped to safe, retryable messages", () => {
  assert.equal(getSafeAuthError(401, "database password mismatch"), "Email or password is incorrect.");
  assert.equal(getSafeAuthError(503, "secret stack trace"), "The authentication service is temporarily unavailable. Please try again.");
  assert.equal(getSafeAuthError(400, "SQLSTATE 23505"), "Something went wrong. Please try again.");
  assert.equal(getNetworkErrorMessage(), NETWORK_ERROR_MESSAGE);
});

test("login and email validation use shared rules", () => {
  assert.equal(validateEmail("merchant@example.com"), undefined);
  assert.equal(validateEmail("not-an-email"), "Enter a valid email address.");
  assert.deepEqual(validateLoginInput({ email: "", password: "" }).errors, {
    email: "Email is required.",
    password: "Password is required.",
  });
  assert.deepEqual(validateLoginInput({ email: " MERCHANT@EXAMPLE.COM ", password: "secret" }), {
    errors: {},
    email: "merchant@example.com",
    password: "secret",
  });
});

test("onboarding state resolver handles every persisted progress state", () => {
  assert.equal(resolveOnboardingState({}), ONBOARDING_STATES.NOT_STARTED);
  assert.equal(
    resolveOnboardingState({ category: "Restaurant" }),
    ONBOARDING_STATES.BUSINESS_TYPE_SELECTED,
  );
  assert.equal(
    resolveOnboardingState({ business: { id: "business-1" } }),
    ONBOARDING_STATES.BUSINESS_CREATED,
  );
  assert.equal(
    resolveOnboardingState({
      business: { id: "business-1" },
      branch: { id: "branch-1" },
    }),
    ONBOARDING_STATES.BRANCH_CREATED,
  );
  assert.equal(
    resolveOnboardingState({
      business: { id: "business-1" },
      branch: { id: "branch-1" },
      verification: { status: "submitted" },
    }),
    ONBOARDING_STATES.VERIFICATION_IN_PROGRESS,
  );
  assert.equal(
    resolveOnboardingState({
      business: { id: "business-1" },
      branch: { id: "branch-1" },
      verification: { status: "approved" },
    }),
    ONBOARDING_STATES.COMPLETED,
  );
});

test("onboarding routes and state validation reject unknown states", () => {
  assert.equal(getOnboardingRoute(ONBOARDING_STATES.BUSINESS_CREATED), "/register/branch");
  assert.equal(getOnboardingRoute(ONBOARDING_STATES.COMPLETED), "/dashboard");
  assert.equal(isOnboardingState("UNKNOWN"), false);
  assert.equal(isOnboardingState(ONBOARDING_STATES.NOT_STARTED), true);
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

test("verification storage accepts matching PDF metadata and signature", () => {
  const result = validateVerificationDocument(
    "business-proof.pdf",
    "application/pdf",
    5,
    new TextEncoder().encode("%PDF-1.7"),
  );
  assert.deepEqual(result, { valid: true, extension: "pdf", mimeType: "application/pdf" });
});

test("verification storage rejects unsupported types and mismatched signatures", () => {
  assert.equal(validateVerificationDocument("script.js", "application/javascript", 5).valid, false);
  assert.equal(
    validateVerificationDocument("proof.pdf", "application/pdf", 5, new TextEncoder().encode("<html>")).valid,
    false,
  );
});

test("verification storage rejects oversized files", () => {
  const result = validateVerificationDocument(
    "proof.png",
    "image/png",
    MAX_VERIFICATION_FILE_SIZE + 1,
  );
  assert.deepEqual(result, { valid: false, error: "Verification documents must be smaller than 10 MB." });
});

test("verification storage rejects unsafe filenames and paths", () => {
  assert.equal(validateVerificationDocument("../proof.pdf", "application/pdf", 5).valid, false);
  assert.equal(isSafeVerificationStoragePath("../proof.pdf"), false);
  assert.equal(isSafeVerificationStoragePath("org/business/request/object.pdf"), false);
});

test("verification storage paths use generated IDs and a safe extension", () => {
  const path = createVerificationStoragePath(
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
    "33333333-3333-4333-8333-333333333333",
    "44444444-4444-4444-8444-444444444444",
    "webp",
  );
  assert.equal(
    path,
    "11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333/44444444-4444-4444-8444-444444444444.webp",
  );
  assert.equal(isSafeVerificationStoragePath(path), true);
});
