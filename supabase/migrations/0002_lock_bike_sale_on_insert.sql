-- lock_bike_sale_fields() only guarded UPDATE, so inserting a row with
-- is_sale = true directly bypassed payment entirely. Branch on TG_OP so the
-- same rule applies at INSERT time (OLD isn't available then).
create or replace function public.lock_bike_sale_fields()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    if new.is_sale and auth.role() <> 'service_role' and not public.is_admin(auth.uid()) then
      raise exception 'is_sale can only be set by the payment service';
    end if;
    return new;
  end if;

  if (new.is_sale is distinct from old.is_sale
      or new.sale_expires_at is distinct from old.sale_expires_at)
     and auth.role() <> 'service_role'
     and not public.is_admin(auth.uid()) then
    raise exception 'is_sale and sale_expires_at can only be set by the payment service';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lock_bike_sale_fields on public.bikes;

create trigger trg_lock_bike_sale_fields
  before insert or update on public.bikes
  for each row execute procedure public.lock_bike_sale_fields();
