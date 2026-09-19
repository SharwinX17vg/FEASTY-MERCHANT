begin;

select plan(12);

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

select * from finish();
rollback;

-- Integration scenarios for a configured Supabase test project:
-- 1. Anonymous users may select approved businesses and active branches only.
-- 2. Anonymous users cannot select profiles, organizations, members, or verification data.
-- 3. An authenticated organization member may read that organization and its businesses.
-- 4. An authenticated member cannot read another organization's private data.
-- 5. Only organization owners/admins may manage members or review verification requests.
-- 6. A non-member cannot insert businesses, branches, verification requests, or audit records.
