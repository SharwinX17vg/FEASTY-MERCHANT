# FEASTY Ecosystem Architecture

## Overview

FEASTY is a two-sided platform that connects people discovering local
businesses with the businesses that create those experiences.

```text
FEASTYMAP (Consumer App)
          |
          v
   Shared Backend / APIs
          |
          v
FEASTY MERCHANT (Business App)
```

The shared backend is the controlled boundary between consumer discovery and
merchant operations. It will eventually provide identity, business data,
verification workflows, publishing rules, analytics, and platform services.

## FEASTYMAP: Consumer App

FEASTYMAP is the consumer-facing application. Its responsibilities include:

- Helping people discover approved restaurants, cafes, bakeries, shops,
  entertainment places, salons, venues, and events.
- Presenting current business information, menus, offers, and specials.
- Showing trustworthy content that has passed the platform's publishing and
  verification rules.
- Supporting consumer-facing discovery, engagement, and future reputation
  experiences.

FEASTYMAP should consume approved platform data rather than becoming the source
of truth for merchant business details.

## FEASTY MERCHANT: Business App

FEASTY MERCHANT is the business-facing application. Its responsibilities
include:

- Registering and onboarding businesses.
- Managing organization, business, and branch information.
- Managing menus, menu items, offers, specials, and events.
- Submitting verification information for administrative review.
- Helping merchants understand profile reach and engagement.
- Providing operational tools and future AI-assisted workflows.

Merchant changes should pass through the appropriate validation and publishing
rules before they become visible in FEASTYMAP.

## Shared Backend / APIs

The shared backend is responsible for:

- Authentication and authorization.
- Persisting merchant and consumer platform data.
- Enforcing organization and branch boundaries.
- Managing verification and approval workflows.
- Exposing public discovery data and authenticated merchant operations.
- Recording audit events for sensitive changes.
- Applying privacy, security, and publishing policies.

## Ownership boundaries

| Surface | Primary responsibility |
| --- | --- |
| FEASTYMAP | Consumer discovery and approved content presentation |
| FEASTY MERCHANT | Business onboarding, management, and publishing preparation |
| Shared backend / APIs | Shared data, policy enforcement, integrations, and access control |

No client application should bypass backend authorization or independently
publish unapproved business content.
