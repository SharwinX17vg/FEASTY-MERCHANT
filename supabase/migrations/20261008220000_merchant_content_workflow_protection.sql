create or replace function public.validate_merchant_content_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.publication_status <> 'draft'
      or new.submitted_at is not null
      or new.published_at is not null
      or new.rejection_reason is not null then
      raise exception 'Content must be created as a draft';
    end if;
    return new;
  end if;

  if new.business_id is distinct from old.business_id
    or new.created_by is distinct from old.created_by then
    raise exception 'Content ownership fields cannot be changed';
  end if;

  if old.publication_status = new.publication_status then
    if new.submitted_at is distinct from old.submitted_at
      or new.published_at is distinct from old.published_at
      or new.rejection_reason is distinct from old.rejection_reason then
      raise exception 'Workflow fields cannot be changed without a status transition';
    end if;

    if old.publication_status not in ('draft', 'rejected')
      and (
        new.publish_at is distinct from old.publish_at
        or new.starts_at is distinct from old.starts_at
        or new.ends_at is distinct from old.ends_at
      ) then
      raise exception 'Scheduling and validity dates can only be changed before review';
    end if;

    return new;
  end if;

  if new.publish_at is distinct from old.publish_at
    or new.starts_at is distinct from old.starts_at
    or new.ends_at is distinct from old.ends_at then
    raise exception 'Scheduling and validity dates cannot change during a workflow transition';
  end if;

  if old.publication_status = 'draft'
    and new.publication_status = 'pending_review' then
    if new.submitted_at is null
      or new.published_at is not null
      or new.rejection_reason is not null then
      raise exception 'Invalid draft submission';
    end if;
    return new;
  end if;

  if old.publication_status = 'rejected'
    and new.publication_status = 'pending_review' then
    if new.submitted_at is null
      or new.published_at is not null
      or new.rejection_reason is not null then
      raise exception 'Invalid rejected-content resubmission';
    end if;
    return new;
  end if;

  if old.publication_status = 'pending_review'
    and new.publication_status = 'rejected' then
    if new.submitted_at is null
      or new.submitted_at is distinct from old.submitted_at
      or new.published_at is not null
      or new.rejection_reason is null
      or length(btrim(new.rejection_reason)) = 0 then
      raise exception 'A rejection requires a reason';
    end if;
    return new;
  end if;

  if old.publication_status = 'pending_review'
    and new.publication_status = 'approved' then
    if new.submitted_at is null
      or new.submitted_at is distinct from old.submitted_at
      or new.published_at is not null
      or new.rejection_reason is not null then
      raise exception 'Invalid content approval';
    end if;
    return new;
  end if;

  if old.publication_status = 'approved'
    and new.publication_status = 'published' then
    if new.submitted_at is null
      or new.submitted_at is distinct from old.submitted_at
      or new.published_at is null
      or new.rejection_reason is not null then
      raise exception 'Invalid content publication';
    end if;
    return new;
  end if;

  raise exception 'Invalid merchant content publication transition: % to %',
    old.publication_status, new.publication_status;
end;
$$;

drop trigger if exists merchant_content_workflow_protection on public.merchant_content;

create trigger merchant_content_workflow_protection
  before insert or update on public.merchant_content
  for each row execute function public.validate_merchant_content_workflow();

revoke execute on function public.validate_merchant_content_workflow() from public;
