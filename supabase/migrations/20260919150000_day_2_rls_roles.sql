alter table public.organization_members
  drop constraint if exists organization_members_role_check;

-- Normalize the Day 2 role model without changing existing platform accounts.
update public.organization_members
set role = case role
  when 'owner' then 'org_owner'
  when 'member' then 'staff'
  when 'viewer' then 'staff'
  else role
end
where role in ('owner', 'member', 'viewer');

alter table public.organization_members
  add constraint organization_members_role_check
  check (role in ('admin', 'moderator', 'org_owner', 'branch_manager', 'staff'));

alter table public.profiles
  drop constraint if exists profiles_platform_role_check;
alter table public.profiles
  add constraint profiles_platform_role_check
  check (platform_role in ('user', 'platform_admin', 'super_admin'));

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and platform_role in ('platform_admin', 'super_admin')
      and status = 'active'
  );
$$;

create or replace function public.is_org_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_platform_admin() or exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = (select auth.uid())
      and status = 'active'
      and role in ('org_owner', 'admin')
  );
$$;

create or replace function public.can_manage_business(target_organization_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_platform_admin() or exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = (select auth.uid())
      and status = 'active'
      and role in ('org_owner', 'admin', 'moderator')
  );
$$;

create or replace function public.can_manage_branch(target_business_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_platform_admin() or exists (
    select 1
    from public.businesses b
    join public.organization_members om on om.organization_id = b.organization_id
    where b.id = target_business_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
      and om.role in ('org_owner', 'admin', 'moderator', 'branch_manager')
  );
$$;

create or replace function public.prevent_verification_decision_changes()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_platform_admin()
    and (
      new.status is distinct from old.status
      or new.reviewer_id is distinct from old.reviewer_id
      or new.reviewed_at is distinct from old.reviewed_at
      or new.decision_notes is distinct from old.decision_notes
    ) then
    raise exception 'only platform reviewers may change verification decisions';
  end if;
  return new;
end;
$$;

drop trigger if exists verification_requests_protect_decision on public.verification_requests;
create trigger verification_requests_protect_decision
  before update on public.verification_requests
  for each row execute function public.prevent_verification_decision_changes();

drop policy if exists businesses_update_member on public.businesses;
create policy businesses_update_manager on public.businesses
  for update to authenticated
  using (public.can_manage_business(organization_id))
  with check (public.can_manage_business(organization_id));

create policy businesses_delete_manager on public.businesses
  for delete to authenticated
  using (public.is_org_admin(organization_id));

drop policy if exists branches_update_member on public.branches;
create policy branches_update_manager on public.branches
  for update to authenticated
  using (public.can_manage_branch(business_id))
  with check (public.can_manage_branch(business_id));

create policy branches_delete_manager on public.branches
  for delete to authenticated
  using (public.can_manage_branch(business_id));

drop policy if exists verification_requests_update_admin on public.verification_requests;
create policy verification_requests_update_platform_reviewer on public.verification_requests
  for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create index if not exists organization_members_org_role_idx
  on public.organization_members(organization_id, role, status);
create index if not exists organization_members_user_status_idx
  on public.organization_members(user_id, status, organization_id);
create index if not exists businesses_org_status_idx
  on public.businesses(organization_id, status);
create index if not exists branches_business_status_idx
  on public.branches(business_id, status);

revoke execute on function public.is_platform_admin() from public;
revoke execute on function public.is_org_member(uuid) from public;
revoke execute on function public.is_org_admin(uuid) from public;
revoke execute on function public.can_manage_business(uuid) from public;
revoke execute on function public.can_manage_branch(uuid) from public;
revoke execute on function public.prevent_verification_decision_changes() from public;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;
grant execute on function public.can_manage_business(uuid) to authenticated;
grant execute on function public.can_manage_branch(uuid) to authenticated;
