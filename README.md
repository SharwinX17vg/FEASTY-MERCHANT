# FEASTY

FEASTY is a technology-driven food and business discovery ecosystem under
active development. It connects merchants, businesses, customers, maps,
intelligent services, and secure digital technologies through a unified
platform.

This repository contains **FEASTY MERCHANT**, the merchant-facing Next.js
application. The ecosystem is evolving: some components are implemented and
tested, while other capabilities remain under development or are planned for
future releases. This is not a final production release.

## Project Status

FEASTY MERCHANT currently provides merchant onboarding, authentication,
business and branch management, content workflows, offers, analytics, and
public discovery APIs. Live integrations still depend on external service
configuration, including a real Supabase project for authenticated flows.

FEASTYMAP, AI and machine-learning capabilities, ScratchAI, blockchain
exploration, and additional ecosystem integrations remain under active
development or exploration unless explicitly documented as implemented in
their respective modules.

## FEASTY Ecosystem

### FEASTY MERCHANT

FEASTY MERCHANT is the merchant and business management platform. It supports
the following implemented or actively developed areas:

- Merchant and business onboarding
- Business and branch management
- Operating hours
- Business content
- Offers and promotions
- Content publishing workflows
- Approval and moderation
- Analytics
- Offer redemption
- Role-based access control
- Secure business and branch data management
- Public discovery APIs

FEASTY MERCHANT is the source of truth for merchant-owned business, branch,
content, and offer data.

### FEASTYMAP

FEASTYMAP is the business discovery and map component of the FEASTY
ecosystem. It is intended to provide map-based and location-based discovery
experiences.

FEASTYMAP consumes published public merchant data through the Merchant API
rather than maintaining a separate merchant database. The intended
integration architecture is:

```text
FEASTY MERCHANT
        |
        v
Public Merchant API
        |
        v
FEASTYMAP API Proxy
        |
        v
Merchant Adapter
        |
        v
Normalized FEASTYMAP Data
        |
        v
Map and Discovery Interface
```

Merchant-owned data remains controlled by FEASTY MERCHANT.

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Leaflet
- OpenStreetMap

### Backend and Database

- Next.js API routes
- REST APIs
- Supabase
- PostgreSQL
- Row Level Security (RLS)
- Authentication and authorization

### Development and Engineering

- Git and GitHub
- Automated testing
- Type checking
- Linting
- Production build validation
- API validation
- Security-focused development

## Project Structure

- `app/` - Next.js App Router routes, layouts, API routes, and route-level
  files.
- `components/` - Reusable UI components shared across routes.
- `lib/` - Shared low-level libraries, validation, authorization, and
  application configuration.
- `types/` - Shared TypeScript and database type definitions.
- `services/` - Modules that coordinate external or backend operations.
- `hooks/` - Reusable React hooks.
- `utils/` - Small, domain-agnostic helper functions.
- `public/` - Static assets served directly by Next.js.
- `docs/` - Architecture and setup documentation.
- `supabase/` - Database migrations and database-level tests.
- `tests/` - Automated application tests.

See [docs/PROJECT-STRUCTURE.md](docs/PROJECT-STRUCTURE.md) for the
responsibilities and boundaries of each folder.

## Local Development

Install dependencies and start the development server from this directory:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to review the application.

### Supabase Configuration

Copy `.env.example` to `.env.local` and provide values from the intended
Supabase project:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_FEASTYMAP_URL=
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` remains supported as a fallback for existing
local environments, but new environments should use
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Never commit `.env.local` or any populated environment file. Do not add
service-role keys, database passwords, JWT secrets, or other privileged
credentials to `NEXT_PUBLIC_` variables. See
[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for the complete Supabase
setup and security guidance.

Signup and other authenticated flows cannot be verified locally until actual
credentials from the intended Supabase project are configured. The
application does not use fake credentials or mock production data to conceal
that limitation.

## Testing and Validation

The commands below are the scripts defined in `package.json`:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Use `git diff --check` to check a proposed change for whitespace errors.
Lint may report framework recommendations as warnings; newly introduced
errors must be fixed.

## Security and Data Architecture

FEASTY follows a single-source-of-truth approach for merchant data:

```text
Merchant enters or updates information
        |
        v
FEASTY MERCHANT
        |
        v
Validation and Publishing Workflow
        |
        v
Authoritative Merchant Data
        |
        v
Public Merchant API
        |
        v
FEASTYMAP
        |
        v
Customer-facing Discovery
```

Security-focused development includes authentication and authorization,
role-based access control, RLS, business and branch data isolation, input
validation, secure public API design, audit logging, secure offer redemption,
protection against unauthorized mutations, server-side handling of private
credentials, and abuse prevention.

## Future and Exploratory Areas

AI and machine learning may support intelligent discovery, recommendations,
personalization, and automation as the ecosystem evolves. ScratchAI is an
evolving component intended to contribute to these capabilities.

Blockchain-related applications such as data verification, record integrity,
trust, transparency, and future decentralized capabilities are being
explored. These areas should not be considered implemented unless explicitly
documented in the relevant module.
