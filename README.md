# FEASTY MERCHANT

FEASTY MERCHANT is the merchant-facing Next.js application in the FEASTY
ecosystem. The current Day 1 foundation provides responsive UI routes, reusable
layout and form primitives, route loading/error boundaries, and Supabase client
scaffolding without connected authentication or backend workflows.

## Project folders

- `app/` - Next.js App Router routes, layouts, and route-level files.
- `components/` - Reusable UI components shared across routes.
- `lib/` - Shared low-level libraries and application configuration.
- `types/` - Shared TypeScript type definitions.
- `services/` - Modules that will coordinate external or backend operations.
- `hooks/` - Reusable React hooks for shared client-side behavior.
- `utils/` - Small, reusable, domain-agnostic helper functions.
- `public/` - Static assets served directly by Next.js.
- `docs/` - Project documentation and architecture notes.

See [docs/PROJECT-STRUCTURE.md](docs/PROJECT-STRUCTURE.md) for the planned
responsibilities and boundaries of each folder. See
[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for the intentionally
unconnected Supabase foundation.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to review
the application. Current routes are `/`, `/login`, `/signup`,
`/register/business-type`, and `/dashboard`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
to automatically optimize and load [Geist](https://vercel.com/font).

## Validation

Run these commands from `feasty-merchant-app/`:

```bash
npm run lint
npm run build
```

The project currently uses local form validation and static dashboard data.
Supabase authentication, API calls, persistence, and production merchant
workflows are not implemented yet.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
