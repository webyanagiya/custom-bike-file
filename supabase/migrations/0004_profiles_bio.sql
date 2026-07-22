-- Adds the "自己紹介" (self-introduction) field requested for the profile
-- edit screen. favorite_genre is kept as-is; this is additive only.
alter table public.profiles add column if not exists bio text;
