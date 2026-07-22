-- Raises the per-bike photo limit from 5 to 30 (product decision, supersedes
-- the original "5 photos" spec from the initial schema design).
alter table public.bike_photos
  drop constraint if exists bike_photos_sort_order_check;

alter table public.bike_photos
  add constraint bike_photos_sort_order_check check (sort_order between 0 and 29);

create or replace function public.enforce_bike_photo_limit()
returns trigger
language plpgsql
as $$
declare
  photo_count integer;
begin
  select count(*) into photo_count from public.bike_photos where bike_id = new.bike_id;
  if photo_count >= 30 then
    raise exception 'a bike can have at most 30 photos';
  end if;
  return new;
end;
$$;
