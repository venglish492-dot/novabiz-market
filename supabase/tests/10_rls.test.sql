-- Row Level Security and fulfilment tests. Runs inside a transaction that is
-- rolled back, so it leaves no data behind. Any failed assertion aborts with
-- an error (use psql -v ON_ERROR_STOP=1).

begin;

create or replace function pg_temp.act_as(p_user uuid) returns void language plpgsql as $$
begin
  if p_user is null then
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claim.role', 'anon', true);
    execute 'set local role anon';
  else
    perform set_config('request.jwt.claim.sub', p_user::text, true);
    perform set_config('request.jwt.claim.role', 'authenticated', true);
    execute 'set local role authenticated';
  end if;
end $$;

create or replace function pg_temp.reset_role() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', '', true);
end $$;

grant execute on all functions in schema pg_temp to anon, authenticated;

-- Fixtures (as the database owner) --------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'alice@example.com', '{"full_name": "Alice", "locale": "en"}'),
  ('22222222-2222-4222-8222-222222222222', 'bob@example.com', '{}'),
  ('33333333-3333-4333-8333-333333333333', 'admin@example.com', '{"full_name": "Admin"}');

update public.profiles set role = 'admin' where id = '33333333-3333-4333-8333-333333333333';

insert into public.products (id, slug, status, product_type, title, category_id, price_amount, currency, creator_id)
values ('d0000000-0000-4000-8000-000000000001', 'draft-product', 'draft', 'guide', '{"ru": "Черновик", "en": "Draft"}',
        'business', 100, 'RUB', 'c0000000-0000-4000-8000-000000000001');

insert into public.product_files (id, product_id, kind, label, storage_path, file_name, version)
values ('f0000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'download',
        '{"ru": "Модель", "en": "Model"}', 'saas/model-4.2.xlsx', 'model-4.2.xlsx', '4.2');

insert into storage.objects (bucket_id, name) values ('product-files', 'saas/model-4.2.xlsx'), ('product-media', 'saas/cover.png');

insert into public.coupons (code, type, amount) values ('WELCOME10', 'percent', 10);

insert into public.orders (id, order_number, user_id, email, status, currency, subtotal_amount, discount_amount, total_amount, provider)
values ('e0000000-0000-4000-8000-000000000001', 'VL-TEST-0001', '11111111-1111-4111-8111-111111111111', 'alice@example.com',
        'payment_pending', 'RUB', 3490, 0, 3490, 'sandbox');
insert into public.order_items (order_id, product_id, title_snapshot, unit_amount, currency, license_tier, version_at_purchase)
values ('e0000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '{"ru": "SaaS", "en": "SaaS"}', 3490, 'RUB', 'commercial', '4.2');
insert into public.payments (order_id, provider, provider_session_id, status, amount, currency)
values ('e0000000-0000-4000-8000-000000000001', 'sandbox', 'sbx_1', 'pending', 3490, 'RUB');

-- 1. Profiles are created automatically ---------------------------------
do $$ begin
  assert (select count(*) from public.profiles) = 3, 'profiles created by trigger';
  assert (select locale from public.profiles where email = 'alice@example.com') = 'en', 'locale copied from metadata';
end $$;

-- 2. Anonymous visitors ---------------------------------------------------
select pg_temp.act_as(null);
do $$ begin
  assert (select count(*) from public.products) = 8, 'anon sees only the 8 published products';
  assert (select count(*) from public.products where slug = 'draft-product') = 0, 'anon cannot see drafts';
  assert (select count(*) from public.orders) = 0, 'anon cannot see orders';
  assert (select count(*) from public.product_files) = 0, 'anon cannot see product files';
  assert (select count(*) from public.coupons) = 0, 'anon cannot see coupons';
  assert (select count(*) from public.profiles) = 0, 'anon cannot see profiles';
  assert (select count(*) from storage.objects where bucket_id = 'product-files') = 0, 'anon cannot list private files';
  assert (select count(*) from storage.objects where bucket_id = 'product-media') = 1, 'anon can read public media';
end $$;
do $$ begin
  begin
    insert into public.reviews (product_id, user_id, rating, body, author_name)
    values ('a1000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 5, repeat('x', 30), 'Anon');
    raise exception 'anon review insert should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.newsletter_subscribers (email) values ('spam@example.com');
    raise exception 'anon newsletter insert should fail';
  exception when insufficient_privilege then null;
  end;
end $$;
select pg_temp.reset_role();

-- 3. A customer cannot escalate privileges or read other customers ----------
select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
do $$ begin
  update public.profiles set full_name = 'Alice Doe' where id = auth.uid();
  assert (select full_name from public.profiles where id = auth.uid()) = 'Alice Doe', 'user can edit own name';
  assert (select count(*) from public.profiles) = 1, 'user sees only own profile';
  begin
    update public.profiles set role = 'admin' where id = auth.uid();
    raise exception 'role escalation should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.orders (order_number, user_id, email, currency, subtotal_amount, total_amount)
    values ('VL-FAKE', auth.uid(), 'alice@example.com', 'RUB', 0, 0);
    raise exception 'client order insert should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.entitlements (user_id, product_id, order_id, license_tier)
    values (auth.uid(), 'a1000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000001', 'commercial');
    raise exception 'client entitlement insert should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.products set price_amount = 1 where id = 'a1000000-0000-4000-8000-000000000001';
    assert (select price_amount from public.products where id = 'a1000000-0000-4000-8000-000000000001') = 3490,
      'customer cannot change prices';
  end;
  begin
    perform public.fulfil_order('e0000000-0000-4000-8000-000000000001', 'sandbox', null);
    raise exception 'customer must not be able to fulfil orders';
  exception when insufficient_privilege then null;
  end;
  assert (select count(*) from public.orders) = 1, 'customer sees own order';
  assert (select count(*) from public.product_files) = 0, 'files hidden before purchase is fulfilled';
end $$;
do $$ begin
  begin
    insert into public.reviews (product_id, user_id, rating, body, author_name)
    values ('a1000000-0000-4000-8000-000000000001', auth.uid(), 5, repeat('x', 30), 'Alice');
    raise exception 'review before ownership should fail';
  exception when insufficient_privilege then null;
  end;
  insert into public.cart_items (user_id, product_id) values (auth.uid(), 'a1000000-0000-4000-8000-000000000001');
  begin
    insert into public.cart_items (user_id, product_id) values ('22222222-2222-4222-8222-222222222222', 'a1000000-0000-4000-8000-000000000002');
    raise exception 'writing another user''s cart should fail';
  exception when insufficient_privilege then null;
  end;
end $$;
select pg_temp.reset_role();

select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
do $$ begin
  assert (select count(*) from public.orders) = 0, 'other customers cannot see the order';
  assert (select count(*) from public.cart_items) = 0, 'other customers cannot see the cart';
end $$;
select pg_temp.reset_role();

-- 4. Fulfilment is atomic and idempotent ---------------------------------
do $$ begin
  assert public.fulfil_order('e0000000-0000-4000-8000-000000000001', 'sandbox', 'sbx_pay_1') = true, 'first fulfilment';
  assert public.fulfil_order('e0000000-0000-4000-8000-000000000001', 'sandbox', 'sbx_pay_1') = false, 'second call is a no-op';
  assert (select count(*) from public.entitlements where order_id = 'e0000000-0000-4000-8000-000000000001') = 1, 'one entitlement';
  assert (select status from public.orders where id = 'e0000000-0000-4000-8000-000000000001') = 'paid', 'order paid';
  assert (select status from public.payments where order_id = 'e0000000-0000-4000-8000-000000000001') = 'succeeded', 'payment succeeded';
  assert (select count(*) from public.cart_items where user_id = '11111111-1111-4111-8111-111111111111') = 0, 'purchased items removed from cart';
end $$;

-- 5. Owners get access; reviews are verified and moderated ----------------
select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
do $$ begin
  assert (select count(*) from public.product_files) = 1, 'owner sees the product file record';
  assert (select count(*) from storage.objects where bucket_id = 'product-files') = 0, 'owner still cannot read the private bucket directly';
  insert into public.reviews (product_id, user_id, rating, body, author_name, status, verified_purchase)
  values ('a1000000-0000-4000-8000-000000000001', auth.uid(), 4, 'A solid model that saved me a lot of setup time.', 'Alice', 'approved', true);
  assert (select status from public.reviews where user_id = auth.uid()) = 'pending', 'self-approval is ignored';
  assert (select verified_purchase from public.reviews where user_id = auth.uid()) = true, 'verified from entitlement';
  update public.reviews set status = 'approved' where user_id = auth.uid();
  assert (select status from public.reviews where user_id = auth.uid()) = 'pending', 'customer cannot approve own review';
end $$;
select pg_temp.reset_role();

select pg_temp.act_as('22222222-2222-4222-8222-222222222222');
do $$ begin
  assert (select count(*) from public.product_files) = 0, 'non-owner cannot see product files';
  assert (select count(*) from public.reviews) = 0, 'pending reviews are not public';
end $$;
select pg_temp.reset_role();

select pg_temp.act_as('33333333-3333-4333-8333-333333333333');
do $$ begin
  assert (select count(*) from public.orders) = 1, 'admin sees all orders';
  assert (select count(*) from public.coupons) = 1, 'admin sees coupons';
  assert (select count(*) from storage.objects where bucket_id = 'product-files') = 1, 'staff can manage private files';
  update public.reviews set status = 'approved', moderated_by = auth.uid(), moderated_at = now()
  where product_id = 'a1000000-0000-4000-8000-000000000001';
  assert (select rating_count from public.products where id = 'a1000000-0000-4000-8000-000000000001') = 1, 'rating count from approved review';
  assert (select rating_average from public.products where id = 'a1000000-0000-4000-8000-000000000001') = 4.00, 'rating average';
  begin
    update public.profiles set role = 'super_admin' where id = auth.uid();
    raise exception 'admins cannot change roles through the API';
  exception when insufficient_privilege then null;
  end;
end $$;
select pg_temp.reset_role();

select pg_temp.act_as(null);
do $$ begin
  assert (select count(*) from public.reviews) = 1, 'approved review is public';
end $$;
select pg_temp.reset_role();

-- 6. Refund revokes access ------------------------------------------------
select public.mark_order_refunded('e0000000-0000-4000-8000-000000000001');
select pg_temp.act_as('11111111-1111-4111-8111-111111111111');
do $$ begin
  assert (select count(*) from public.product_files) = 0, 'access revoked after refund';
  assert (select status from public.orders) = 'refunded', 'order refunded';
end $$;
select pg_temp.reset_role();

select 'RLS tests passed' as result;
rollback;
