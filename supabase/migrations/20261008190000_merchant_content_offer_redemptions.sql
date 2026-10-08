create table public.merchant_content_offer_redemptions (
  business_id uuid not null references public.businesses(id) on delete cascade,
  content_id uuid not null references public.merchant_content(id) on delete cascade,
  redemption_date date not null default (timezone('utc', now())::date),
  redemption_count bigint not null default 0 check (redemption_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (content_id, redemption_date),
  unique (business_id, content_id, redemption_date)
);

create index merchant_content_offer_redemptions_business_content_idx
  on public.merchant_content_offer_redemptions(business_id, content_id);

alter table public.merchant_content_offer_redemptions enable row level security;

create policy merchant_content_offer_redemptions_select_member on public.merchant_content_offer_redemptions
  for select to authenticated
  using (
    public.is_org_member((select organization_id from public.businesses where id = business_id))
  );

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
