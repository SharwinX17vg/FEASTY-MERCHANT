create table public.content_audit_log (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.merchant_content(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (
    action in (
      'create',
      'update',
      'submit',
      'resubmit',
      'reject',
      'approve',
      'publish',
      'schedule',
      'unschedule',
      'reschedule',
      'unpublish',
      'delete',
      'archive'
    )
  ),
  from_status text,
  to_status text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index content_audit_log_content_idx
  on public.content_audit_log(content_id, created_at desc);

create index content_audit_log_business_idx
  on public.content_audit_log(business_id, created_at desc);

create index content_audit_log_created_at_idx
  on public.content_audit_log(created_at desc);

alter table public.content_audit_log enable row level security;

create policy content_audit_log_select_reviewer on public.content_audit_log
  for select to authenticated
  using (
    public.can_manage_business(
      (select organization_id from public.businesses where id = business_id)
    )
  );

create policy content_audit_log_insert_member on public.content_audit_log
  for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and public.can_manage_branch(business_id)
    and exists (
      select 1
      from public.merchant_content
      where id = content_id
        and merchant_content.business_id = content_audit_log.business_id
    )
  );

create or replace function public.prevent_content_audit_log_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'content audit history is append-only';
end;
$$;

create trigger content_audit_log_prevent_update
  before update on public.content_audit_log
  for each row execute function public.prevent_content_audit_log_mutation();

create trigger content_audit_log_prevent_delete
  before delete on public.content_audit_log
  for each row execute function public.prevent_content_audit_log_mutation();

revoke update, delete on public.content_audit_log from anon, authenticated;
revoke execute on function public.prevent_content_audit_log_mutation() from public;
