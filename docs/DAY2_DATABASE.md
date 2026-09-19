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

