alter table public.merchant_content enable row level security;
alter table public.merchant_content_analytics enable row level security;
alter table public.content_audit_log enable row level security;
alter table public.merchant_content_offer_redemptions enable row level security;
alter table public.merchant_content_offer_redemption_nonces enable row level security;

revoke insert, update, delete on public.merchant_content_analytics from anon, authenticated;
revoke insert, update, delete on public.merchant_content_offer_redemptions from anon, authenticated;
revoke all on public.merchant_content_offer_redemption_nonces from anon, authenticated;
