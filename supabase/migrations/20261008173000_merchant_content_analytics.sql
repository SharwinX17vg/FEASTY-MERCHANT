create table public.merchant_content_analytics (
  business_id uuid not null references public.businesses(id) on delete cascade,
  content_id uuid not null references public.merchant_content(id) on delete cascade,
  event_date date not null default (timezone('utc', now())::date),
  event_type text not null check (event_type in ('view', 'click')),
  event_count bigint not null default 0 check (event_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (content_id, event_date, event_type),
  unique (business_id, content_id, event_date, event_type)
);

create index merchant_content_analytics_business_content_idx
  on public.merchant_content_analytics(business_id, content_id);

alter table public.merchant_content_analytics enable row level security;

create policy merchant_content_analytics_select_member on public.merchant_content_analytics
  for select to authenticated
  using (
    public.is_org_member((select organization_id from public.businesses where id = business_id))
  );

create or replace function public.record_content_analytics_event(
  p_content_id uuid,
  p_event_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  content_business_id uuid;
begin
  if p_event_type not in ('view', 'click') then
    raise exception 'Invalid analytics event type';
  end if;

  select business_id
    into content_business_id
    from public.merchant_content
   where id = p_content_id
     and publication_status = 'published'
     and (starts_at is null or starts_at <= timezone('utc', now()))
     and (ends_at is null or ends_at > timezone('utc', now()));

  if content_business_id is null then
    raise exception 'Content is not publicly active';
  end if;

  insert into public.merchant_content_analytics (
    business_id, content_id, event_date, event_type, event_count
  )
  values (
    content_business_id, p_content_id, timezone('utc', now())::date, p_event_type, 1
  )
  on conflict (content_id, event_date, event_type)
  do update set
    event_count = merchant_content_analytics.event_count + 1,
    updated_at = timezone('utc', now());
end;
$$;

revoke all on function public.record_content_analytics_event(uuid, text) from public;
grant execute on function public.record_content_analytics_event(uuid, text) to anon, authenticated;
