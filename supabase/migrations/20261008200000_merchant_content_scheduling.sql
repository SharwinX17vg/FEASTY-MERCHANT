alter table public.merchant_content
  add column if not exists publish_at timestamptz;

alter table public.merchant_content
  add constraint merchant_content_publish_at_before_end_check
  check (publish_at is null or ends_at is null or publish_at < ends_at);

drop policy if exists merchant_content_select_published_public on public.merchant_content;

create policy merchant_content_select_published_public on public.merchant_content
  for select to anon, authenticated
  using (
    publication_status = 'published'
    and (publish_at is null or publish_at <= timezone('utc', now()))
    and (starts_at is null or starts_at <= timezone('utc', now()))
    and (ends_at is null or ends_at > timezone('utc', now()))
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
     and (publish_at is null or publish_at <= timezone('utc', now()))
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

create or replace function public.record_content_offer_redemption(p_content_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  content_business_id uuid;
begin
  select business_id
    into content_business_id
    from public.merchant_content
   where id = p_content_id
     and content_type = 'offer'
     and offer_code is not null
     and publication_status = 'published'
     and (publish_at is null or publish_at <= timezone('utc', now()))
     and (starts_at is null or starts_at <= timezone('utc', now()))
     and (ends_at is null or ends_at > timezone('utc', now()));

  if content_business_id is null then
    raise exception 'Offer is not publicly active';
  end if;

  insert into public.merchant_content_offer_redemptions (
    business_id, content_id, redemption_date, redemption_count
  )
  values (
    content_business_id, p_content_id, timezone('utc', now())::date, 1
  )
  on conflict (content_id, redemption_date)
  do update set
    redemption_count = merchant_content_offer_redemptions.redemption_count + 1,
    updated_at = timezone('utc', now());
end;
$$;

revoke all on function public.record_content_offer_redemption(uuid) from public;
grant execute on function public.record_content_offer_redemption(uuid) to anon, authenticated;
