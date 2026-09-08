-- Bring older Cat Club profiles up to date with the fields used by signup
-- and the avatar/shop features.
alter table if exists public.profiles
  add column if not exists kitty_bucks integer not null default 0;

alter table if exists public.profiles
  add column if not exists avatar_unlocks jsonb not null default '{}'::jsonb;

alter table if exists public.profiles
  add column if not exists avatar_accessory text not null default 'none';
