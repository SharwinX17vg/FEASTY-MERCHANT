create extension if not exists pgcrypto;

create sequence if not exists public.organization_code_seq;
create sequence if not exists public.business_code_seq;
create sequence if not exists public.branch_code_seq;
create sequence if not exists public.verification_code_seq;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.next_human_code(prefix text, sequence_name regclass)
returns text
language plpgsql
as $$
declare
  next_number bigint;
begin
  next_number := nextval(sequence_name);
  return prefix || '-' || lpad(next_number::text, 6, '0');
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  phone text,
  platform_role text not null default 'user'
    check (platform_role in ('user', 'platform_admin')),
  status text not null default 'active'
    check (status in ('active', 'suspended', 'deleted')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default public.next_human_code('ORG', 'public.organization_code_seq'),
  name text not null check (length(btrim(name)) between 2 and 160),
  legal_name text,
  tax_id text,
  email text,
  phone text,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'member', 'viewer')),
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended', 'removed')),
  invited_by uuid references public.profiles(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (organization_id, user_id)
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null unique default public.next_human_code('BIZ', 'public.business_code_seq'),
  name text not null check (length(btrim(name)) between 2 and 160),
  category text not null check (length(btrim(category)) between 2 and 80),
  description text,
  email text,
  phone text,
  website_url text,
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'approved', 'rejected', 'suspended', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  code text not null unique default public.next_human_code('BRN', 'public.branch_code_seq'),
  name text not null check (length(btrim(name)) between 2 and 160),
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text,
  postal_code text,
  country_code text not null default 'IN'
    check (country_code ~ '^[A-Z]{2}$'),
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  phone text,
  opening_hours jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default public.next_human_code('VER', 'public.verification_code_seq'),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete restrict,
  reviewer_id uuid references public.profiles(id) on delete set null,
  status text not null default 'submitted'
    check (status in ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  decision_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (reviewer_id is null or reviewed_at is not null),
  check (reviewed_at is null or status in ('approved', 'rejected'))
);

create table public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  verification_request_id uuid not null references public.verification_requests(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  storage_path text not null unique,
  document_type text not null check (length(btrim(document_type)) between 2 and 80),
  original_filename text not null check (length(btrim(original_filename)) between 1 and 255),
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (length(btrim(action)) between 2 and 100),
  entity_type text not null check (length(btrim(entity_type)) between 2 and 100),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index organization_members_user_id_idx on public.organization_members(user_id);
create index businesses_organization_id_idx on public.businesses(organization_id);
create index businesses_approved_idx on public.businesses(status) where status = 'approved';
create index branches_business_id_idx on public.branches(business_id);
create index branches_location_idx on public.branches(latitude, longitude);
create index verification_requests_organization_id_idx on public.verification_requests(organization_id);
create index verification_requests_business_id_idx on public.verification_requests(business_id);
create index verification_requests_status_idx on public.verification_requests(status);
create index verification_documents_request_id_idx on public.verification_documents(verification_request_id);
create index audit_logs_organization_created_idx on public.audit_logs(organization_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

create or replace function public.provision_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name')
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_platform_admin()
    and (new.platform_role is distinct from old.platform_role
      or new.status is distinct from old.status) then
    raise exception 'only platform administrators may change profile privileges';
  end if;
  return new;
end;
$$;

create or replace function public.add_organization_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.organization_members (
      organization_id, user_id, role, status, joined_at
    )
    values (new.id, new.created_by, 'owner', 'active', timezone('utc', now()))
    on conflict (organization_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.provision_profile();

create trigger profiles_protect_privileges before update on public.profiles
  for each row execute function public.protect_profile_privileges();
create trigger organizations_add_owner after insert on public.organizations
  for each row execute function public.add_organization_owner();
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger organization_members_set_updated_at before update on public.organization_members
  for each row execute function public.set_updated_at();
create trigger businesses_set_updated_at before update on public.businesses
  for each row execute function public.set_updated_at();
create trigger branches_set_updated_at before update on public.branches
  for each row execute function public.set_updated_at();
create trigger verification_requests_set_updated_at before update on public.verification_requests
  for each row execute function public.set_updated_at();

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and platform_role = 'platform_admin' and status = 'active'
  );
$$;

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_platform_admin() or exists (
    select 1 from public.organization_members
    where organization_id = target_organization_id
      and user_id = (select auth.uid())
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
    select 1 from public.organization_members
    where organization_id = target_organization_id
      and user_id = (select auth.uid())
      and status = 'active'
      and role in ('owner', 'admin')
  );
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.businesses enable row level security;
alter table public.branches enable row level security;
alter table public.verification_requests enable row level security;
alter table public.verification_documents enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_platform_admin());
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_platform_admin())
  with check (id = (select auth.uid()) or public.is_platform_admin());

create policy organizations_select_member on public.organizations
  for select to authenticated
  using (public.is_org_member(id));
create policy organizations_insert_authenticated on public.organizations
  for insert to authenticated
  with check (created_by = (select auth.uid()) or created_by is null);
create policy organizations_update_admin on public.organizations
  for update to authenticated
  using (public.is_org_admin(id))
  with check (public.is_org_admin(id));

create policy organization_members_select_member on public.organization_members
  for select to authenticated
  using (public.is_org_member(organization_id));
create policy organization_members_insert_admin on public.organization_members
  for insert to authenticated
  with check (public.is_org_admin(organization_id));
create policy organization_members_update_admin on public.organization_members
  for update to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));
create policy organization_members_delete_admin on public.organization_members
  for delete to authenticated
  using (public.is_org_admin(organization_id));

create policy businesses_select_approved_public on public.businesses
  for select to anon, authenticated
  using (status = 'approved');
create policy businesses_select_member on public.businesses
  for select to authenticated
  using (public.is_org_member(organization_id));
create policy businesses_insert_member on public.businesses
  for insert to authenticated
  with check (public.is_org_member(organization_id));
create policy businesses_update_member on public.businesses
  for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy branches_select_approved_public on public.branches
  for select to anon, authenticated
  using (
    status = 'active'
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.status = 'approved'
    )
  );
create policy branches_select_member on public.branches
  for select to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and public.is_org_member(b.organization_id)
    )
  );
create policy branches_insert_member on public.branches
  for insert to authenticated
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and public.is_org_member(b.organization_id)
    )
  );
create policy branches_update_member on public.branches
  for update to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and public.is_org_member(b.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and public.is_org_member(b.organization_id)
    )
  );

create policy verification_requests_select_member on public.verification_requests
  for select to authenticated
  using (public.is_org_member(organization_id));
create policy verification_requests_insert_member on public.verification_requests
  for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and status in ('draft', 'submitted')
    and reviewer_id is null
    and reviewed_at is null
    and public.is_org_member(organization_id)
    and exists (
      select 1 from public.businesses b
      where b.id = verification_requests.business_id
        and b.organization_id = verification_requests.organization_id
    )
  );
create policy verification_requests_update_admin on public.verification_requests
  for update to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy verification_documents_select_member on public.verification_documents
  for select to authenticated
  using (
    exists (
      select 1
      from public.verification_requests vr
      where vr.id = verification_request_id
        and public.is_org_member(vr.organization_id)
    )
  );
create policy verification_documents_insert_member on public.verification_documents
  for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and exists (
      select 1
      from public.verification_requests vr
      where vr.id = verification_request_id
        and public.is_org_member(vr.organization_id)
    )
  );
create policy verification_documents_delete_admin on public.verification_documents
  for delete to authenticated
  using (
    exists (
      select 1
      from public.verification_requests vr
      where vr.id = verification_request_id
        and public.is_org_admin(vr.organization_id)
    )
  );

create policy audit_logs_select_admin on public.audit_logs
  for select to authenticated
  using (
    (organization_id is null and public.is_platform_admin())
    or (organization_id is not null and public.is_org_admin(organization_id))
  );
create policy audit_logs_insert_member on public.audit_logs
  for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and (
      (organization_id is null and public.is_platform_admin())
      or (organization_id is not null and public.is_org_member(organization_id))
    )
  );

revoke update, delete on public.audit_logs from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verification-documents',
  'verification-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.can_upload_verification_object(object_name text)
returns boolean
language plpgsql
stable
security definer set search_path = public
as $$
declare
  request_id uuid;
begin
  if object_name !~ '^[0-9a-fA-F-]{36}/.+$' then
    return false;
  end if;

  request_id := split_part(object_name, '/', 1)::uuid;
  return exists (
    select 1
    from public.verification_requests vr
    where vr.id = request_id
      and public.is_org_member(vr.organization_id)
  );
end;
$$;

create policy verification_documents_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'verification-documents'
    and exists (
      select 1
      from public.verification_documents vd
      join public.verification_requests vr on vr.id = vd.verification_request_id
      where vd.storage_path = name and public.is_org_member(vr.organization_id)
    )
  );
create policy verification_documents_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'verification-documents'
    and public.can_upload_verification_object(name)
  );
create policy verification_documents_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'verification-documents'
    and exists (
      select 1
      from public.verification_documents vd
      join public.verification_requests vr on vr.id = vd.verification_request_id
      where vd.storage_path = name and public.is_org_admin(vr.organization_id)
    )
  );
