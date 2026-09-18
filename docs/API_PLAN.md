# Future API Plan

This document outlines the intended API surface for FEASTYMAP and FEASTY
MERCHANT. It is a planning reference only; these endpoints are not implemented
by this checkpoint.

## API boundary

```text
Public FEASTYMAP requests
          |
          v
      Shared APIs
          ^
          |
Authenticated FEASTY MERCHANT requests
```

Public endpoints expose only approved, publishable information. Merchant
endpoints require an authenticated user and organization-scoped authorization.
Administrative endpoints require additional privileged roles.

## Public discovery APIs

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `GET` | `/businesses` | List approved businesses with category, location, and discovery filters. | Public |
| `GET` | `/businesses/:businessId` | Retrieve an approved business profile. | Public |
| `GET` | `/offers` | List currently published offers. | Public |
| `GET` | `/events` | List published events and discovery information. | Public |
| `GET` | `/businesses/:businessId/menu` | Retrieve a published business menu. | Public |
| `GET` | `/businesses/:businessId/reviews` | Retrieve approved reviews and summary reputation data. | Public |

Public responses must exclude private merchant details, verification materials,
internal moderation notes, and unpublished content.

## Authenticated merchant APIs

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `GET` | `/merchant/business` | Retrieve the current organization's business workspace. | Authenticated merchant |
| `PATCH` | `/business` | Update permitted business profile information. | Authenticated merchant |
| `POST` | `/verification` | Submit business verification materials for review. | Authenticated merchant |
| `POST` | `/menu` | Create a menu for an authorized business or branch. | Authenticated merchant |
| `PATCH` | `/menu/:menuId` | Update an authorized menu. | Authenticated merchant |
| `POST` | `/offers` | Create a draft or publishable offer. | Authenticated merchant |
| `DELETE` | `/offer/:offerId` | Remove an authorized offer according to publishing rules. | Authenticated merchant |
| `POST` | `/events` | Create a business event. | Authenticated merchant |
| `GET` | `/notifications` | Retrieve notifications for the current merchant user. | Authenticated merchant |

## Workflow notes

### `GET /businesses`

Should support location, category, text, and availability filters while
returning only approved businesses. Pagination and stable sorting should be
defined before implementation.

### `GET /offers`

Should return only offers that are published and within their active window,
unless an authenticated merchant is requesting their own drafts.

### `GET /events`

Should return published future and active events, with filtering by location,
category, and date range.

### `POST /verification`

Should validate the merchant's organization scope, accept only permitted
verification metadata or document references, and create a reviewable request.
It should not immediately make a business publicly approved.

### `POST /menu`

Should create a menu in the merchant's authorized organization scope and
respect branch ownership and publishing state.

### `PATCH /business`

Should validate editable fields, record an audit event, and route changes
through any required approval workflow.

### `DELETE /offer`

Should verify ownership, support safe removal or archival semantics, and record
the change for auditing.

## API standards

- Use consistent authentication and organization authorization checks.
- Validate request payloads and return structured error responses.
- Use pagination for collection endpoints.
- Return explicit publication and approval states.
- Avoid exposing service-role credentials or privileged internal fields.
- Record sensitive mutations in `audit_logs`.
- Define rate limits, idempotency behavior, and versioning before production use.
