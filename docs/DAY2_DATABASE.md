# Day 2 database foundation

[`supabase/migrations/20260919100000_day_2_database_foundation.sql`](../supabase/migrations/20260919100000_day_2_database_foundation.sql)
defines profiles, organizations, memberships, businesses, branches,
verification requests/documents, and audit logs. It also adds generated human
codes, timestamp triggers, restrictive row-level security, and a private
verification-documents storage bucket/policies.

Apply the migration with the Supabase CLI or the SQL editor, then run the
policies in [`supabase/tests/001_day_2_rls.sql`](../supabase/tests/001_day_2_rls.sql)
against a non-production test project. The application does not use a service
role key in browser code.

## Organization isolation and roles

All private organization, membership, business, branch, verification, and audit
queries are scoped through an active `organization_members` row. A submitted
`organization_id` or `business_id` is not sufficient to cross that boundary.
Branch policies resolve access through the related business and organization.

The supported role model is:

- `super_admin`: platform-wide administration and verification decisions.
- `admin`: organization administration, membership management, and business/branch management.
- `moderator`: organization business and branch management; no platform decisions.
- `org_owner`: organization owner privileges and business/branch management.
- `branch_manager`: branch management within the member's organization.
- `staff`: read access to organization-scoped merchant data and no privileged mutations.

Legacy `owner`, `member`, and `viewer` rows are migrated to `org_owner` and
`staff`. Existing `platform_admin` profiles remain compatible with the
platform-level helper and may coexist with the explicit `super_admin` role.

Verification requests are organization-scoped for merchant reads and
submissions. Status, reviewer, review timestamp, and decision notes are guarded
by both RLS and a database trigger so merchants cannot approve themselves or
rewrite reviewer decisions.

Audit logs have insert/select policies only; `UPDATE` and `DELETE` are revoked
from `anon` and `authenticated`, making them append-only from the application
roles' perspective.

The SQL files include static policy/function checks and documented integration
scenarios. They have not been executed against a connected Supabase project in
this workspace; run them with the Supabase CLI or SQL editor in a non-production
test project before deployment.
