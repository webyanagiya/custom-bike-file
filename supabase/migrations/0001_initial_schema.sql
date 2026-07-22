-- ============================================================
-- 0001: 拡張機能・共通トリガー関数
-- ============================================================
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- profiles（会員プロフィール）
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null,
  prefecture text,
  favorite_genre text,
  instagram text,
  youtube text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.prevent_admin_self_promotion()
returns trigger
language plpgsql
as $$
begin
  if new.is_admin is distinct from old.is_admin
     and auth.role() <> 'service_role'
     and not public.is_admin(auth.uid()) then
    raise exception 'only an existing admin can change is_admin';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_admin_self_promotion
  before update on public.profiles
  for each row execute procedure public.prevent_admin_self_promotion();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nickname', 'New Rider'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- bikes（投稿＝バイクファイル本体）
-- ============================================================
create table public.bikes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  maker text not null,
  model text not null,
  year smallint,
  cc integer,
  style text,
  status text not null default 'normal' check (status in ('normal', 'progress', 'full')),
  title text not null,
  custom_point text,
  instagram_url text,
  views integer not null default 0,
  is_sale boolean not null default false,
  is_sold boolean not null default false,
  sale_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bikes_owner_id_idx on public.bikes (owner_id);
create index bikes_maker_idx on public.bikes (maker);
create index bikes_status_idx on public.bikes (status);
create index bikes_sale_idx on public.bikes (is_sale, sale_expires_at);

alter table public.bikes enable row level security;

create trigger trg_bikes_updated_at
  before update on public.bikes
  for each row execute procedure public.set_updated_at();

create policy "bikes are publicly readable"
  on public.bikes for select
  using (true);

create policy "owners can insert their own bikes"
  on public.bikes for insert
  with check (auth.uid() = owner_id);

create policy "owners can update their own bikes"
  on public.bikes for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owners can delete their own bikes"
  on public.bikes for delete
  using (auth.uid() = owner_id);

create or replace function public.lock_bike_sale_fields()
returns trigger
language plpgsql
as $$
begin
  if (new.is_sale is distinct from old.is_sale
      or new.sale_expires_at is distinct from old.sale_expires_at)
     and auth.role() <> 'service_role'
     and not public.is_admin(auth.uid()) then
    raise exception 'is_sale and sale_expires_at can only be set by the payment service';
  end if;
  return new;
end;
$$;

create trigger trg_lock_bike_sale_fields
  before update on public.bikes
  for each row execute procedure public.lock_bike_sale_fields();

create or replace function public.increment_bike_views(bike_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bikes set views = views + 1 where id = bike_id;
end;
$$;

grant execute on function public.increment_bike_views(uuid) to anon, authenticated;

-- ============================================================
-- bike_photos（投稿写真、最大5枚）
-- ============================================================
create table public.bike_photos (
  id uuid primary key default gen_random_uuid(),
  bike_id uuid not null references public.bikes (id) on delete cascade,
  storage_path text not null,
  sort_order smallint not null default 0 check (sort_order between 0 and 4),
  created_at timestamptz not null default now(),
  unique (bike_id, sort_order)
);

create index bike_photos_bike_id_idx on public.bike_photos (bike_id);

alter table public.bike_photos enable row level security;

create policy "bike photos are publicly readable"
  on public.bike_photos for select
  using (true);

create policy "owners can manage photos of their own bikes"
  on public.bike_photos for all
  using (exists (select 1 from public.bikes b where b.id = bike_photos.bike_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.bikes b where b.id = bike_photos.bike_id and b.owner_id = auth.uid()));

create or replace function public.enforce_bike_photo_limit()
returns trigger
language plpgsql
as $$
declare
  photo_count integer;
begin
  select count(*) into photo_count from public.bike_photos where bike_id = new.bike_id;
  if photo_count >= 5 then
    raise exception 'a bike can have at most 5 photos';
  end if;
  return new;
end;
$$;

create trigger trg_enforce_bike_photo_limit
  before insert on public.bike_photos
  for each row execute procedure public.enforce_bike_photo_limit();

-- ============================================================
-- favorites（お気に入り）
-- ============================================================
create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  bike_id uuid not null references public.bikes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, bike_id)
);

create index favorites_bike_id_idx on public.favorites (bike_id);

alter table public.favorites enable row level security;

create policy "users can view their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "users can add their own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "users can remove their own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- ============================================================
-- shops（ショップ登録）
-- ============================================================
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete set null,
  name text not null,
  prefecture text,
  address text,
  business_hours text,
  instagram text,
  description text,
  photo_url text,
  is_approved boolean not null default false,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shops_prefecture_idx on public.shops (prefecture);
create index shops_is_approved_idx on public.shops (is_approved);

alter table public.shops enable row level security;

create trigger trg_shops_updated_at
  before update on public.shops
  for each row execute procedure public.set_updated_at();

create policy "approved shops are public, owners and admins see their own"
  on public.shops for select
  using (is_approved or owner_id = auth.uid() or public.is_admin(auth.uid()));

create policy "members can submit shops"
  on public.shops for insert
  with check (auth.uid() = owner_id);

create policy "owners and admins can update shops"
  on public.shops for update
  using (owner_id = auth.uid() or public.is_admin(auth.uid()))
  with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

create policy "owners and admins can delete shops"
  on public.shops for delete
  using (owner_id = auth.uid() or public.is_admin(auth.uid()));

create or replace function public.lock_shop_approval_fields()
returns trigger
language plpgsql
as $$
begin
  if (new.is_approved is distinct from old.is_approved
      or new.approved_by is distinct from old.approved_by
      or new.approved_at is distinct from old.approved_at)
     and auth.role() <> 'service_role'
     and not public.is_admin(auth.uid()) then
    raise exception 'only an admin can approve a shop';
  end if;
  return new;
end;
$$;

create trigger trg_lock_shop_approval_fields
  before update on public.shops
  for each row execute procedure public.lock_shop_approval_fields();

-- ============================================================
-- events（イベント登録）
-- ============================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete set null,
  title text not null,
  event_date date not null,
  prefecture text,
  venue text,
  organizer text,
  description text,
  is_approved boolean not null default false,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_event_date_idx on public.events (event_date);
create index events_is_approved_idx on public.events (is_approved);

alter table public.events enable row level security;

create trigger trg_events_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

create policy "approved events are public, owners and admins see their own"
  on public.events for select
  using (is_approved or owner_id = auth.uid() or public.is_admin(auth.uid()));

create policy "members can submit events"
  on public.events for insert
  with check (auth.uid() = owner_id);

create policy "owners and admins can update events"
  on public.events for update
  using (owner_id = auth.uid() or public.is_admin(auth.uid()))
  with check (owner_id = auth.uid() or public.is_admin(auth.uid()));

create policy "owners and admins can delete events"
  on public.events for delete
  using (owner_id = auth.uid() or public.is_admin(auth.uid()));

create or replace function public.lock_event_approval_fields()
returns trigger
language plpgsql
as $$
begin
  if (new.is_approved is distinct from old.is_approved
      or new.approved_by is distinct from old.approved_by
      or new.approved_at is distinct from old.approved_at)
     and auth.role() <> 'service_role'
     and not public.is_admin(auth.uid()) then
    raise exception 'only an admin can approve an event';
  end if;
  return new;
end;
$$;

create trigger trg_lock_event_approval_fields
  before update on public.events
  for each row execute procedure public.lock_event_approval_fields();

-- ============================================================
-- sale_orders（売ります決済記録）
-- ============================================================
create table public.sale_orders (
  id uuid primary key default gen_random_uuid(),
  bike_id uuid not null references public.bikes (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  amount integer not null default 980,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  payment_provider text,
  provider_session_id text,
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index sale_orders_bike_id_idx on public.sale_orders (bike_id);
create index sale_orders_user_id_idx on public.sale_orders (user_id);
create unique index sale_orders_provider_session_id_idx
  on public.sale_orders (provider_session_id)
  where provider_session_id is not null;

alter table public.sale_orders enable row level security;

create policy "users and admins can view their own sale orders"
  on public.sale_orders for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- Deliberately no insert/update/delete policy: a real 980-yen payment must be
-- confirmed server-side (e.g. a verified Stripe webhook) using the
-- service_role key, which bypasses RLS. No client role can write here, so
-- listing status can't be forged from the browser. lock_bike_sale_fields()
-- above then lets that same trusted write flip bikes.is_sale.

-- ============================================================
-- storage buckets（画像保存用）
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('bike-photos', 'bike-photos', true),
  ('shop-photos', 'shop-photos', true)
on conflict (id) do nothing;

-- Convention: every uploaded object's path starts with "<uid>/...", so
-- storage.foldername(name)[1] is checked against auth.uid() for ownership.
create policy "avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users can manage their own avatar files"
  on storage.objects for all
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "bike photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'bike-photos');

create policy "owners can manage their own bike photo files"
  on storage.objects for all
  using (bucket_id = 'bike-photos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'bike-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "shop photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'shop-photos');

create policy "members can manage their own shop photo files"
  on storage.objects for all
  using (bucket_id = 'shop-photos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'shop-photos' and auth.uid()::text = (storage.foldername(name))[1]);
