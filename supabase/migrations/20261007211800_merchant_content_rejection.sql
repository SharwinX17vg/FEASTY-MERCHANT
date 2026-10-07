alter table public.merchant_content
  add column if not exists rejection_reason text;
