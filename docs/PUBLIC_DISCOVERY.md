# Public discovery contract

FEASTY Merchant is the source of truth for merchant-managed businesses, locations, and published content. FEASTYMAP is a read-only consumer of the public projection.

## Endpoint

`GET /api/public/discovery`

Supported query parameters:

- `page`: positive integer, default `1`
- `limit`: integer from `1` to `50`, default `20`
- `category`: exact case-insensitive category filter
- `search`: bounded name/description search
- `city`: case-insensitive branch-city filter

The response is:

```json
{
  "data": [
    {
      "public_id": "BIZ-...",
      "name": "Example business",
      "category": "Cafe",
      "description": "Public description",
      "website_url": "https://example.test",
      "status": "approved",
      "branches": [],
      "content": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "has_next": false
  }
}
```

Only approved businesses, active branches, and currently public content are returned. Public content must be published, past `publish_at`, within `starts_at`/`ends_at`, and is mapped explicitly rather than exposing database rows. FEASTYMAP must not mutate these records or use merchant credentials.

Business and branch human codes are the stable public identifiers. Content UUIDs remain public references because existing public analytics and redemption endpoints use them.

The endpoint is bounded to 50 businesses per request and performs bounded business, branch, and content queries for the selected page (city filtering adds one bounded branch lookup). It does not provide a real-time guarantee; consumers should fetch again to observe merchant changes.
