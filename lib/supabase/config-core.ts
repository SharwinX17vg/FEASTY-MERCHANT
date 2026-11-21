export class SupabaseConfigurationError extends Error {
  readonly missingVariables: readonly string[];

  constructor(missingVariables: readonly string[]) {
    super("Supabase environment configuration is incomplete.");
    this.name = "SupabaseConfigurationError";
    this.missingVariables = missingVariables;
  }
}

export function getSupabaseEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !publishableKey) {
    const missingVariables = [
      !url ? "NEXT_PUBLIC_SUPABASE_URL" : undefined,
      !publishableKey ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : undefined,
    ].filter((variable): variable is string => variable !== undefined);
    throw new SupabaseConfigurationError(missingVariables);
  }

  return { url, publishableKey };
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
}

export function getFeastyMapUrl() {
  return process.env.NEXT_PUBLIC_FEASTYMAP_URL?.trim() || "https://feastymap.example";
}
