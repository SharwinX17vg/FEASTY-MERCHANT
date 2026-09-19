import {
  AsYouType,
  getCountryCallingCode,
  getCountries,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
  parsePhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

export const supportedCountries = getCountries().map((country) => ({
  country,
  callingCode: `+${getCountryCallingCode(country)}`,
  flag: country
    .split("")
    .map((letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397))
    .join(""),
  name:
    new Intl.DisplayNames(["en"], { type: "region" }).of(country) ?? country,
}));

export function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function validateEmail(value: unknown) {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? undefined
    : "Enter a valid email address.";
}

export function validateLoginInput(input: Record<string, unknown>) {
  const email = normalizeEmail(input.email);
  const password = String(input.password ?? "");
  const errors: { email?: string; password?: string } = {};
  if (!email) errors.email = "Email is required.";
  else {
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
  }
  if (!password) errors.password = "Password is required.";
  return { errors, email, password };
}

export function validatePassword(value: unknown) {
  const password = String(value ?? "");
  const requirements = getPasswordRequirements(password);
  const missingRequirement = requirements.find((requirement) => !requirement.met);
  if (missingRequirement) return missingRequirement.error;
  return undefined;
}

export function getPasswordRequirements(value: unknown) {
  const password = String(value ?? "");
  return [
    {
      id: "length",
      label: "Minimum 8 characters",
      met: password.length >= 8,
      error: "Use at least 8 characters.",
    },
    {
      id: "uppercase",
      label: "One uppercase letter",
      met: /[A-Z]/.test(password),
      error: "Include at least one uppercase letter.",
    },
    {
      id: "lowercase",
      label: "One lowercase letter",
      met: /[a-z]/.test(password),
      error: "Include at least one lowercase letter.",
    },
    {
      id: "number",
      label: "One number",
      met: /[0-9]/.test(password),
      error: "Include at least one number.",
    },
    {
      id: "symbol",
      label: "One special character",
      met: /[^A-Za-z0-9]/.test(password),
      error: "Include at least one symbol.",
    },
  ];
}

export function getPasswordStrength(value: unknown) {
  const requirements = getPasswordRequirements(value);
  const score = requirements.filter((requirement) => requirement.met).length;
  return {
    score,
    label: score === 5 ? "Strong" : score >= 3 ? "Fair" : "Weak",
  } as const;
}

export function formatPhone(value: string, country: CountryCode) {
  return new AsYouType(country).input(value);
}

export function detectPhoneCountry(value: unknown) {
  return parsePhoneNumberFromString(String(value ?? "").trim())?.country;
}

export function reformatPhone(
  value: string,
  fromCountry: CountryCode,
  toCountry: CountryCode,
) {
  const parsed = parsePhoneNumberFromString(value, fromCountry);
  const nationalNumber =
    parsed?.country === fromCountry ? parsed.nationalNumber : value.replace(/\D/g, "");

  return formatPhone(nationalNumber, toCountry);
}

export function normalizePhone(value: unknown, country: CountryCode) {
  const input = String(value ?? "").trim();
  if (!input || !isPossiblePhoneNumber(input, country) || !isValidPhoneNumber(input, country)) {
    return { error: "Enter a valid phone number for the selected country." };
  }

  const parsedPhone = parsePhoneNumber(input, country);
  if (parsedPhone.country !== country) {
    return { error: "Enter a valid phone number for the selected country." };
  }

  return { e164: parsedPhone.number };
}

export function validateSignupInput(input: Record<string, unknown>) {
  const name = String(input.name ?? "").trim();
  const email = normalizeEmail(input.email);
  const country = String(input.country ?? "").trim().toUpperCase() as CountryCode;
  const phone = String(input.phone ?? "").trim();
  const password = String(input.password ?? "");
  const confirmPassword = String(input.confirmPassword ?? "");
  const termsAccepted = input.termsAccepted === true;
  const errors: Record<string, string> = {};

  if (name.length < 2) errors.name = "Enter your full name.";
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (!country || !getCountries().includes(country)) errors.country = "Select a valid country.";
  if (country) {
    const phoneResult = normalizePhone(phone, country);
    if (phoneResult.error) errors.phone = phoneResult.error;
  }
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
  if (!termsAccepted) errors.terms = "Accept the Terms & Privacy Policy to continue.";

  return { errors, email, name, country, phone };
}
