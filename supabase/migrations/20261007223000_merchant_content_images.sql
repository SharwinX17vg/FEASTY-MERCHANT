alter table public.merchant_content
  add column if not exists image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'merchant-content-images',
  'merchant-content-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy merchant_content_images_insert_manager on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'merchant-content-images'
    and name ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}\.(jpg|jpeg|png|webp)$'
    and public.can_manage_business(split_part(name, '/', 1)::uuid)
  );

create policy merchant_content_images_delete_manager on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'merchant-content-images'
    and name ~ '^[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}\.(jpg|jpeg|png|webp)$'
    and public.can_manage_business(split_part(name, '/', 1)::uuid)
  );
