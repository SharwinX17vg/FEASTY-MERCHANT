alter table public.merchant_content
  add column if not exists original_price numeric(10, 2),
  add column if not exists offer_price numeric(10, 2),
  add column if not exists discount_percentage numeric(5, 2),
  add column if not exists offer_code text;

alter table public.merchant_content
  add constraint merchant_content_offer_details_check check (
    (
      content_type = 'post'
      and original_price is null
      and offer_price is null
      and discount_percentage is null
      and offer_code is null
    )
    or (
      content_type = 'offer'
      and (original_price is null or original_price > 0)
      and (offer_price is null or offer_price >= 0)
      and (original_price is null or offer_price is null or offer_price <= original_price)
      and (discount_percentage is null or discount_percentage between 0 and 100)
      and (offer_code is null or length(btrim(offer_code)) between 1 and 50)
    )
  );
