begin;

select plan(24);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'organizations', 'organizations table exists');
select has_table('public', 'organization_members', 'organization_members table exists');
select has_table('public', 'businesses', 'businesses table exists');
select has_table('public', 'branches', 'branches table exists');
select has_table('public', 'verification_requests', 'verification_requests table exists');
select has_table('public', 'verification_documents', 'verification_documents table exists');
select has_table('public', 'audit_logs', 'audit_logs table exists');
select has_index('public', 'organizations', 'organizations_code_key', 'organization code is unique');
select has_index('public', 'businesses', 'businesses_code_key', 'business code is unique');
select has_index('public', 'branches', 'branches_code_key', 'branch code is unique');
select has_index('public', 'verification_requests', 'verification_requests_code_key', 'verification code is unique');
select has_policy('public', 'organizations', 'organizations_select_member', 'organizations are member-scoped');
select has_policy('public', 'organization_members', 'organization_members_select_member', 'memberships are member-scoped');
select has_policy('public', 'businesses', 'businesses_select_member', 'businesses are organization-scoped');
select has_policy('public', 'businesses', 'businesses_update_manager', 'business updates are role-scoped');
select has_policy('public', 'businesses', 'businesses_delete_manager', 'business deletes are owner/admin-scoped');
select has_policy('public', 'branches', 'branches_select_member', 'branches flow through business membership');
select has_policy('public', 'branches', 'branches_update_manager', 'branch updates are role-scoped');
select has_policy('public', 'branches', 'branches_delete_manager', 'branch deletes are role-scoped');
select has_policy('public', 'verification_requests', 'verification_requests_insert_member', 'verification submissions are member-scoped');
select has_policy('public', 'verification_requests', 'verification_requests_update_platform_reviewer', 'verification decisions are platform-scoped');
select has_policy('public', 'audit_logs', 'audit_logs_insert_member', 'audit logs are insert-only for actors');
select has_function('public', 'prevent_verification_decision_changes', ARRAY[]::text[], 'verification decisions have a database guard');

select * from finish();
rollback;

-- Integration scenarios for a configured Supabase test project:
-- A. anon cannot read organizations, memberships, private businesses, branches, or verification data.
-- B. an Organization A member can read Organization A but not Organization B.
-- C. a branch_manager cannot update or delete Organization B branches.
-- D. a merchant cannot approve a verification request or assign a reviewer.
-- E. an ordinary member cannot update platform_role or update/delete audit logs.
-- F. an org_owner can manage Organization A business/branch records, but not verification decisions.
