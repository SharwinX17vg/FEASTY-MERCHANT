# FEASTY MERCHANT Project Structure

This document describes the intended responsibilities of the FEASTY MERCHANT
application folders. The structure is an architectural foundation only; folders
should receive files when the related feature is implemented rather than being
filled with placeholder files.

## Application structure

```text
feasty-merchant-app/
├── app/
├── components/
├── lib/
├── types/
├── services/
├── hooks/
├── utils/
├── public/
└── docs/
```

## Folder responsibilities

### `app/`

Owns the Next.js App Router surface: routes, layouts, loading and error
boundaries, route handlers, and other route-specific files. Route composition
belongs here, while reusable presentation and business logic should remain in
the appropriate shared folder.

### `components/`

Contains reusable React components and UI building blocks shared by multiple
routes. Components should focus on presentation and user interaction, receiving
data and callbacks through well-defined props.

### `lib/`

Contains shared application-level libraries and configuration that do not fit a
single feature. This may include clients, constants, and infrastructure
adapters once those concerns are introduced.

### `types/`

Contains shared TypeScript types and interfaces used across routes, components,
services, and hooks. Feature-specific types may stay close to their feature
until they are reused.

### `services/`

Contains modules responsible for coordinating data access and external
integrations. Services should keep transport and integration details out of
components and route presentation.

### `hooks/`

Contains reusable React hooks for shared client-side stateful behavior and
subscriptions. Hooks should remain focused and should not become a replacement
for services or general-purpose utilities.

### `utils/`

Contains small, reusable, domain-agnostic helpers such as formatting,
validation, and transformations. Utilities should be easy to test independently
and should not own application state.

### `public/`

Contains static assets that Next.js serves from the application root. Assets
should be referenced by their public URL and should not contain runtime logic.

### `docs/`

Contains project-level documentation, decisions, and architecture notes. This
folder should explain how the application is organized without becoming a
second source of implementation code.

## Current boundaries

- The application uses the Next.js App Router with route-level `loading.tsx`,
  `error.tsx`, `global-error.tsx`, and `not-found.tsx` boundaries.
- The current routes are presentation and foundation surfaces; they do not
  implement authenticated backend workflows.
- No authentication, backend integration, or API implementation is connected.
- Empty folders are intentionally left without placeholder files until they are
  needed by a real implementation.
