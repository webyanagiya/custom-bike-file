alter table public.shops
  add column if not exists specialty text,
  add column if not exists phone text,
  add column if not exists website_url text,
  add column if not exists youtube text,
  add column if not exists closed_days text;

alter table public.bikes
  add column if not exists shop_id uuid references public.shops(id) on delete set null;

alter table public.events
  add column if not exists shop_id uuid references public.shops(id) on delete set null;

create index if not exists bikes_shop_id_idx on public.bikes (shop_id);
create index if not exists events_shop_id_idx on public.events (shop_id);
