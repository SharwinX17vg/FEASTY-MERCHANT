drop policy if exists content_audit_log_insert_member on public.content_audit_log;

revoke insert on public.content_audit_log from anon, authenticated;

create or replace function public.write_merchant_content_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_action text;
  audit_from_status text;
  audit_to_status text;
  audit_details jsonb := '{}'::jsonb;
begin
  if (select auth.uid()) is null
    or not exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
    )
    or not public.can_manage_branch(new.business_id) then
    raise exception 'Only an authorized business manager can create content audit history';
  end if;

  if tg_op = 'INSERT' then
    audit_action := 'create';
    audit_to_status := new.publication_status;
  else
    if new.publication_status is distinct from old.publication_status then
      audit_from_status := old.publication_status;
      audit_to_status := new.publication_status;
      audit_action := case
        when old.publication_status = 'draft'
          and new.publication_status = 'pending_review' then 'submit'
        when old.publication_status = 'rejected'
          and new.publication_status = 'pending_review' then 'resubmit'
        when old.publication_status = 'pending_review'
          and new.publication_status = 'rejected' then 'reject'
        when old.publication_status = 'pending_review'
          and new.publication_status = 'approved' then 'approve'
        when old.publication_status = 'approved'
          and new.publication_status = 'published'
          and new.publish_at > timezone('utc', now()) then 'schedule'
        when old.publication_status = 'approved'
          and new.publication_status = 'published' then 'publish'
        else null
      end;
      if audit_action = 'reject' then
        audit_details := jsonb_build_object('rejection_reason', new.rejection_reason);
      end if;
    elsif new.publish_at is distinct from old.publish_at then
      audit_action := case
        when old.publish_at is null then 'schedule'
        when new.publish_at is null then 'unschedule'
        else 'reschedule'
      end;
      audit_from_status := old.publication_status;
      audit_to_status := new.publication_status;
    elsif (to_jsonb(new) - 'updated_at' - 'image_path')
      is distinct from (to_jsonb(old) - 'updated_at' - 'image_path') then
      audit_action := 'update';
      audit_from_status := old.publication_status;
      audit_to_status := new.publication_status;
    else
      return new;
    end if;

    if audit_action is null then
      raise exception 'Invalid content audit transition';
    end if;
  end if;

  insert into public.content_audit_log (
    content_id,
    business_id,
    actor_id,
    action,
    from_status,
    to_status,
    details
  )
  values (
    new.id,
    new.business_id,
    (select auth.uid()),
    audit_action,
    audit_from_status,
    audit_to_status,
    audit_details
  );

  return new;
end;
$$;

drop trigger if exists merchant_content_audit_integrity on public.merchant_content;

create trigger merchant_content_audit_integrity
  after insert or update on public.merchant_content
  for each row execute function public.write_merchant_content_audit();

revoke execute on function public.write_merchant_content_audit() from public;
