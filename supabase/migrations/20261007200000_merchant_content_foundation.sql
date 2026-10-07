create table public.merchant_content (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  content_type text not null check (content_type in ('post', 'offer')),
  title text not null check (length(btrim(title)) between 2 and 160),
  body text not null check (length(btrim(body)) between 1 and 5000),
  starts_at timestamptz,
  ends_at timestamptz,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'pending_review', 'approved', 'published', 'rejected')),
  submitted_at timestamptz,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index merchant_content_business_status_idx
  on public.merchant_content(business_id, publication_status);

alter table public.merchant_content enable row level security;

create policy merchant_content_select_member on public.merchant_content
  for select to authenticated
  using (public.is_org_member((select organization_id from public.businesses where id = business_id)));

create policy merchant_content_select_published_public on public.merchant_content
  for select to anon, authenticated
  using (
    publication_status = 'published'
    and (starts_at is null or starts_at <= timezone('utc', now()))
    and (ends_at is null or ends_at > timezone('utc', now()))
  );

create policy merchant_content_insert_manager on public.merchant_content
  for insert to authenticated
  with check (public.can_manage_business(business_id));

create policy merchant_content_update_manager on public.merchant_content
  for update to authenticated
  using (public.can_manage_business(business_id))
  with check (public.can_manage_business(business_id));
