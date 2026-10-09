begin;

select plan(10);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.merchant_content'::regclass),
  'merchant content has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.merchant_content_analytics'::regclass),
  'content analytics has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.content_audit_log'::regclass),
  'content audit log has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.merchant_content_offer_redemptions'::regclass),
  'offer redemptions have RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.merchant_content_offer_redemption_nonces'::regclass),
  'redemption nonces have RLS enabled'
);

select ok(
  not has_table_privilege('authenticated', 'public.merchant_content_analytics', 'INSERT'),
  'authenticated clients cannot insert analytics rows directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.merchant_content_offer_redemptions', 'UPDATE'),
  'authenticated clients cannot update redemption aggregates directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.merchant_content_offer_redemption_nonces', 'SELECT'),
  'authenticated clients cannot read redemption nonces directly'
);
select ok(
  not has_table_privilege('anon', 'public.merchant_content_offer_redemptions', 'DELETE'),
  'anonymous clients cannot delete redemption aggregates directly'
);
select ok(
  not has_table_privilege('anon', 'public.merchant_content_offer_redemption_nonces', 'INSERT'),
  'anonymous clients cannot insert redemption nonces directly'
);

select * from finish();
rollback;
