# Supabase Setup

The merchant application uses Supabase for authentication and database-backed
merchant workflows. A local Supabase project configuration is required before
running authenticated flows.

## Environment variables

Copy `.env.example` to `.env.local` and provide values only when a Supabase
project is ready to be connected:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` remains supported as a fallback for existing
local environments, but new environments should use
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### Supabase URL

`NEXT_PUBLIC_SUPABASE_URL` is the URL of the Supabase project. It identifies
which Supabase project the application should communicate with.

### Anon key

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is the public anonymous key intended for use in
client-side applications. It works with Supabase Row Level Security (RLS), so
database policies must protect every resource before data access is added.

The `NEXT_PUBLIC_` prefix means this value can be included in browser bundles.
It is not a secret and must never be treated as an authorization bypass.

### Service role key

The service role key is a privileged server-side key that bypasses Row Level
Security. It is not part of this foundation and must be added only to a
server-only environment if a future, reviewed requirement needs it.

## Key safety

- Never commit `.env.local` or any populated environment file.
- Never expose a service role key, database password, JWT secret, or other
  privileged credential to the browser.
- Never add a service role key to a `NEXT_PUBLIC_` variable.
- Keep the anon key protected by correctly configured RLS policies.

## Foundation modules

- `lib/supabase/client.ts` exposes a lazy browser client factory.
- `lib/supabase/server.ts` exposes a cookie-aware server-side client factory.
- `services/supabase.ts` validates environment configuration and creates the
  shared Supabase client.
- `types/database.ts` contains the application's database types.

When configuration is missing, server routes return a safe configuration
message and never include environment values, credentials, or stack traces.
