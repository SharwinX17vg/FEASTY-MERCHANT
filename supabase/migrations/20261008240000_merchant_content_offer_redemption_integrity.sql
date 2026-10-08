create table public.merchant_content_offer_redemption_nonces (
  nonce uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.merchant_content(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index merchant_content_offer_redemption_nonces_content_idx
  on public.merchant_content_offer_redemption_nonces(content_id, expires_at);

alter table public.merchant_content_offer_redemption_nonces enable row level security;

revoke all on function public.record_content_offer_redemption(uuid) from public, anon, authenticated;
drop function if exists public.record_content_offer_redemption(uuid);

create or replace function public.issue_content_offer_redemption_nonce(p_content_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  issued_nonce uuid;
begin
  if not exists (
    select 1
    from public.merchant_content
    where id = p_content_id
      and content_type = 'offer'
      and offer_code is not null
      and publication_status = 'published'
      and (publish_at is null or publish_at <= timezone('utc', now()))
      and (starts_at is null or starts_at <= timezone('utc', now()))
      and (ends_at is null or ends_at > timezone('utc', now()))
  ) then
    raise exception 'Offer is not publicly active';
  end if;

  insert into public.merchant_content_offer_redemption_nonces (
    content_id,
    expires_at
  )
  values (
    p_content_id,
    timezone('utc', now()) + interval '5 minutes'
  )
  returning nonce into issued_nonce;

  return issued_nonce;
end;
$$;

create or replace function public.record_content_offer_redemption(
  p_content_id uuid,
  p_offer_code text,
  p_nonce uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  content_business_id uuid;
  claimed_nonce uuid;
begin
  if p_offer_code is null or length(btrim(p_offer_code)) = 0 then
    raise exception 'Offer code is required';
  end if;

  select business_id
    into content_business_id
    from public.merchant_content
   where id = p_content_id
     and content_type = 'offer'
     and offer_code = btrim(p_offer_code)
     and publication_status = 'published'
     and (publish_at is null or publish_at <= timezone('utc', now()))
     and (starts_at is null or starts_at <= timezone('utc', now()))
     and (ends_at is null or ends_at > timezone('utc', now()));

  if content_business_id is null then
    raise exception 'Offer is not publicly active';
  end if;

  update public.merchant_content_offer_redemption_nonces
     set used_at = timezone('utc', now())
   where nonce = p_nonce
     and content_id = p_content_id
     and used_at is null
     and expires_at > timezone('utc', now())
  returning nonce into claimed_nonce;

  if claimed_nonce is null then
    raise exception 'Redemption token is invalid or already used';
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

revoke all on function public.issue_content_offer_redemption_nonce(uuid) from public;
grant execute on function public.issue_content_offer_redemption_nonce(uuid) to anon, authenticated;

revoke all on function public.record_content_offer_redemption(uuid) from public;
revoke all on function public.record_content_offer_redemption(uuid, text, uuid) from public;
grant execute on function public.record_content_offer_redemption(uuid, text, uuid) to anon, authenticated;
