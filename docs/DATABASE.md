# Planned Database Architecture

This document describes the planned PostgreSQL data model for FEASTY. It is an
architecture reference only. No SQL schema or migration is defined here.

## Data model principles

- Organizations own business accounts and provide the tenant boundary.
- Businesses represent merchant-facing locations or brands within an
  organization.
- Branches represent individual physical operating locations when a business
  has more than one location.
- Public content must follow verification and publishing rules.
- Sensitive changes should be traceable through audit logs.
- Row-level access should be designed around organization membership and
  explicit roles.

## Relationship overview

```text
users
  |
  +-- organization membership --> organizations
                                  |
                                  v
                              businesses
                                  |
                                  v
                               branches
                                  |
                 +----------------+----------------+
                 v                v                v
               menus           offers            events
                 |                                 |
                 v                                 v
            menu_items                         reviews

organizations / businesses
          |
          +-- verification_requests
          +-- notifications
          +-- audit_logs
```

## Planned tables

### `users`

| Attribute | Planned design |
| --- | --- |
| Purpose | Represents an authenticated platform user and their profile. |
| Primary key | `id` — UUID, aligned with the authentication identity. |
| Important fields | Display name, email metadata, phone metadata, status, timestamps. |
| Relationships | Belongs to organizations through membership; may create audit entries, verification requests, and reviews. |

### `organizations`

| Attribute | Planned design |
| --- | --- |
| Purpose | Tenant boundary for a merchant company or business group. |
| Primary key | `id` — UUID. |
| Important fields | Name, legal details, contact information, status, timestamps. |
| Relationships | Has users through membership, businesses, notifications, audit logs, and verification requests. |

### `businesses`

| Attribute | Planned design |
| --- | --- |
| Purpose | Merchant-facing business profile shown through approved discovery surfaces. |
| Primary key | `id` — UUID. |
| Important fields | Organization reference, category, name, description, contact details, profile status, approval state. |
| Relationships | Belongs to an organization; has branches, menus, offers, events, reviews, and verification requests. |

### `branches`

| Attribute | Planned design |
| --- | --- |
| Purpose | Represents a physical location operated by a business. |
| Primary key | `id` — UUID. |
| Important fields | Business reference, address, coordinates, phone, opening hours, status. |
| Relationships | Belongs to a business; may have branch-specific menus, offers, events, and reviews. |

### `menus`

| Attribute | Planned design |
| --- | --- |
| Purpose | Groups menu content for a business or branch. |
| Primary key | `id` — UUID. |
| Important fields | Business or branch reference, title, description, status, visibility, timestamps. |
| Relationships | Belongs to a business and optionally a branch; has menu items. |

### `menu_items`

| Attribute | Planned design |
| --- | --- |
| Purpose | Stores an individual food, product, or service entry in a menu. |
| Primary key | `id` — UUID. |
| Important fields | Menu reference, name, description, price, image reference, availability, sort order. |
| Relationships | Belongs to a menu; may reference a category or future menu taxonomy. |

### `offers`

| Attribute | Planned design |
| --- | --- |
| Purpose | Stores time-bound promotions and merchant-published specials. |
| Primary key | `id` — UUID. |
| Important fields | Business or branch reference, title, description, terms, start and end time, status. |
| Relationships | Belongs to a business and optionally a branch; may be linked to analytics and audit logs. |

### `events`

| Attribute | Planned design |
| --- | --- |
| Purpose | Stores events hosted or promoted by a business. |
| Primary key | `id` — UUID. |
| Important fields | Business or branch reference, title, description, venue details, start and end time, status. |
| Relationships | Belongs to a business and optionally a branch; can receive consumer reviews after the platform rules allow it. |

### `reviews`

| Attribute | Planned design |
| --- | --- |
| Purpose | Stores consumer feedback about an approved business, branch, or experience. |
| Primary key | `id` — UUID. |
| Important fields | User reference, business or branch reference, rating, text, moderation state, timestamps. |
| Relationships | Belongs to a user and a reviewable business or branch; moderation actions should be auditable. |

### `notifications`

| Attribute | Planned design |
| --- | --- |
| Purpose | Delivers platform and merchant workflow notifications. |
| Primary key | `id` — UUID. |
| Important fields | Recipient reference, organization or business reference, type, title, message, read state, timestamps. |
| Relationships | Belongs to a user and may be scoped to an organization or business. |

### `audit_logs`

| Attribute | Planned design |
| --- | --- |
| Purpose | Provides an immutable record of important platform and merchant changes. |
| Primary key | `id` — UUID. |
| Important fields | Actor reference, organization reference, action, entity type, entity ID, metadata, timestamp. |
| Relationships | References the user who performed an action and the affected organization or entity. |

### `verification_requests`

| Attribute | Planned design |
| --- | --- |
| Purpose | Tracks business verification submissions and administrative decisions. |
| Primary key | `id` — UUID. |
| Important fields | Business reference, requester reference, status, submitted materials, reviewer reference, decision notes, timestamps. |
| Relationships | Belongs to a business; references submitting and reviewing users; creates notifications and audit logs. |

## Future considerations

The model may later add organization membership, roles, content moderation,
analytics events, media assets, and approval history as separate tables. Those
decisions should be made with the access-control and publishing workflows,
rather than added as unbounded fields to the core tables.
