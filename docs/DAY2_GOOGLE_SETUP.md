# Day 2 Google OAuth setup

Google OAuth is initiated at `/api/auth/oauth` and returns to
`/auth/callback?next=/dashboard`.

In Supabase Authentication settings:

1. Enable the Google provider.
2. Add the Google client ID and secret.
3. Add the Supabase callback URL shown by the provider configuration.
4. Add the local and production site URLs to the redirect allow list.

No OAuth client secret is stored in this repository. Provider configuration is
an external Supabase/Google deployment responsibility.

