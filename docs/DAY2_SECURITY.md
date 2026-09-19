# Day 2 security notes

- Only public Supabase URL/publishable (or legacy anon) keys are accepted by
  browser and server clients.
- Session cookies are refreshed in the Next.js proxy using Supabase SSR.
- Internal redirect targets are validated before auth redirects.
- Protected application routes require authenticated claims when Supabase is
  configured.
- Verification documents use private storage policies.
- API handlers validate required input and return generic authentication
  failures.

Before production, configure Supabase Auth, email delivery, Google OAuth, and
the production site URL. Do not add a service-role key to `.env.local` unless a
separate server-only administrative workflow explicitly requires it.
