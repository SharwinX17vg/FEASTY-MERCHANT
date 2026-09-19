import {
  AsYouType,
  getCountryCallingCode,
  getCountries,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
  parsePhoneNumber,
  type CountryCode,
} from "libphonenumber-js";

export const supportedCountries = getCountries().map((country) => ({
  country,
  callingCode: `+${getCountryCallingCode(country)}`,
}));

export function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function validatePassword(value: unknown) {
  const password = String(value ?? "");
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Include at least one lowercase letter.";
  if (!/[0-9]/.test(password)) return "Include at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Include at least one symbol.";
  return undefined;
}

export function formatPhone(value: string, country: CountryCode) {
  return new AsYouType(country).input(value);
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
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
