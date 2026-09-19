# Day 2 authentication setup

FEASTY MERCHANT now uses `@supabase/ssr` for browser and server clients. The
root [`proxy.ts`](../proxy.ts) refreshes sessions and protects `/dashboard` and
`/register`. Without Supabase environment variables, the visual shell remains
available for local UI work; auth and persistence require a configured project.

Set the variables in `.env.local` from `.env.example`. Configure the Supabase
Site URL and redirect URL as `${NEXT_PUBLIC_SITE_URL}/auth/callback`.

Implemented routes include password signup/login, Google OAuth initiation,
email confirmation handling, sign-out, forgot password, and reset password.
The API deliberately returns generic auth errors.

