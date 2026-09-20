create sequence if not exists public.menu_item_code_seq;

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  code text not null unique default public.next_human_code('MENU', 'public.menu_item_code_seq'),
  name text not null check (length(btrim(name)) between 2 and 160),
  description text,
  category text,
  price numeric(10, 2) not null check (price >= 0),
  is_available boolean not null default true,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index menu_items_branch_status_idx
  on public.menu_items(branch_id, status, is_available);

alter table public.menu_items enable row level security;

create policy menu_items_select_member on public.menu_items
  for select to authenticated
  using (
    exists (
      select 1
      from public.branches b
      where b.id = menu_items.branch_id
        and public.is_org_member(
          (select organization_id from public.businesses where id = b.business_id)
        )
    )
  );

create policy menu_items_insert_manager on public.menu_items
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.branches b
      where b.id = menu_items.branch_id
        and public.can_manage_branch(b.business_id)
    )
  );

create policy menu_items_update_manager on public.menu_items
  for update to authenticated
  using (
    exists (
      select 1
      from public.branches b
      where b.id = menu_items.branch_id
        and public.can_manage_branch(b.business_id)
    )
  )
  with check (
    exists (
      select 1
      from public.branches b
      where b.id = menu_items.branch_id
        and public.can_manage_branch(b.business_id)
    )
  );

create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();
