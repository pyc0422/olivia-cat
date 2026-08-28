create extension if not exists pgcrypto;

create table if not exists allowed_members (
  name text primary key,
  member_group text not null check (member_group in ('members', 'new_members')),
  display_order integer not null
);

insert into allowed_members (name, member_group, display_order) values
  ('Izzy', 'members', 1),
  ('Lexi', 'members', 2),
  ('Olivia', 'members', 3),
  ('Eve', 'members', 4),
  ('Alison', 'members', 5),
  ('Hailey', 'members', 6),
  ('Elise', 'new_members', 7),
  ('Audrey', 'new_members', 8)
on conflict (name) do update
set member_group = excluded.member_group,
    display_order = excluded.display_order;

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null unique references allowed_members (name),
  email text not null unique,
  phone text unique,
  member_group text not null check (member_group in ('members', 'new_members')),
  board_visible boolean not null default true,
  level text not null default 'Noob' check (level in ('Noob', 'Kitten', 'Warrior', 'Guard', 'Queen', 'Trainer', 'Leader')),
  kitty_bucks integer not null default 0,
  avatar_unlocks jsonb not null default '{}'::jsonb,
  avatar_color text not null default 'orange',
  avatar_eyes text not null default 'round',
  avatar_mouth text not null default 'smile',
  avatar_clothes text not null default 'hoodie',
  avatar_accessory text not null default 'none',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists profiles
add column if not exists board_visible boolean not null default true;
alter table if exists profiles
add column if not exists kitty_bucks integer not null default 0;
alter table if exists profiles
add column if not exists avatar_unlocks jsonb not null default '{}'::jsonb;
alter table if exists profiles
add column if not exists avatar_accessory text not null default 'none';

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  author_name text not null references allowed_members (name),
  body text not null check (char_length(body) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_created_at on messages (created_at desc);
create index if not exists idx_messages_user_id on messages (user_id);

create table if not exists drawings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  author_name text not null references allowed_members (name),
  title text,
  mime_type text not null default 'image/png',
  data_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_drawings_created_at on drawings (created_at desc);
create index if not exists idx_drawings_user_id on drawings (user_id);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  author_name text not null references allowed_members (name),
  title text,
  mime_type text not null default 'video/webm',
  data_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_videos_created_at on videos (created_at desc);
create index if not exists idx_videos_user_id on videos (user_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    name,
    email,
    phone,
    member_group,
    board_visible,
    level,
    kitty_bucks,
    avatar_unlocks,
    avatar_color,
    avatar_eyes,
    avatar_mouth,
    avatar_clothes,
    avatar_accessory,
    last_login_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'member_group', 'members'),
    true,
    coalesce(new.raw_user_meta_data ->> 'level', 'Noob'),
    coalesce((new.raw_user_meta_data ->> 'kitty_bucks')::integer, 0),
    coalesce(new.raw_user_meta_data -> 'avatar_unlocks', '{}'::jsonb),
    coalesce(new.raw_user_meta_data ->> 'avatar_color', 'orange'),
    coalesce(new.raw_user_meta_data ->> 'avatar_eyes', 'round'),
    coalesce(new.raw_user_meta_data ->> 'avatar_mouth', 'smile'),
    coalesce(new.raw_user_meta_data ->> 'avatar_clothes', 'hoodie'),
    coalesce(new.raw_user_meta_data ->> 'avatar_accessory', 'none'),
    now()
  )
  on conflict (id) do update
  set name = excluded.name,
      email = excluded.email,
      phone = excluded.phone,
      member_group = excluded.member_group,
      level = excluded.level,
      kitty_bucks = excluded.kitty_bucks,
      avatar_unlocks = excluded.avatar_unlocks,
      avatar_color = excluded.avatar_color,
      avatar_eyes = excluded.avatar_eyes,
      avatar_mouth = excluded.avatar_mouth,
      avatar_clothes = excluded.avatar_clothes,
      avatar_accessory = excluded.avatar_accessory,
      last_login_at = excluded.last_login_at,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

create or replace function prune_messages()
returns trigger
language plpgsql
as $$
begin
  delete from messages where created_at < now() - interval '30 days';
  delete from messages
  where id in (
    select id
    from messages
    order by created_at desc
    offset 500
  );
  return new;
end;
$$;

drop trigger if exists trg_prune_messages on messages;
create trigger trg_prune_messages
after insert on messages
for each row execute function prune_messages();

create or replace function prune_drawings()
returns trigger
language plpgsql
as $$
begin
  delete from drawings where created_at < now() - interval '30 days';
  delete from drawings
  where id in (
    select id
    from drawings
    order by created_at desc
    offset 120
  );
  return new;
end;
$$;

drop trigger if exists trg_prune_drawings on drawings;
create trigger trg_prune_drawings
after insert on drawings
for each row execute function prune_drawings();

create or replace function prune_videos()
returns trigger
language plpgsql
as $$
begin
  delete from videos where created_at < now() - interval '30 days';
  delete from videos
  where id in (
    select id
    from videos
    order by created_at desc
    offset 60
  );
  return new;
end;
$$;

drop trigger if exists trg_prune_videos on videos;
create trigger trg_prune_videos
after insert on videos
for each row execute function prune_videos();

alter table allowed_members enable row level security;
alter table profiles enable row level security;
alter table messages enable row level security;
alter table drawings enable row level security;
alter table videos enable row level security;

drop policy if exists "Allowed members are visible" on allowed_members;
create policy "Allowed members are visible"
on allowed_members
for select
to anon, authenticated
using (true);

drop policy if exists "Profiles are visible to signed in users" on profiles;
create policy "Profiles are visible to signed in users"
on profiles
for select
to authenticated
using (true);

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile"
on profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
on profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Messages are visible to signed in users" on messages;
create policy "Messages are visible to signed in users"
on messages
for select
to authenticated
using (true);

drop policy if exists "Users can create their own messages" on messages;
create policy "Users can create their own messages"
on messages
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own messages" on messages;
create policy "Users can delete their own messages"
on messages
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Drawings are visible to signed in users" on drawings;
create policy "Drawings are visible to signed in users"
on drawings
for select
to authenticated
using (true);

drop policy if exists "Users can create their own drawings" on drawings;
create policy "Users can create their own drawings"
on drawings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own drawings" on drawings;
create policy "Users can delete their own drawings"
on drawings
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Videos are visible to signed in users" on videos;
create policy "Videos are visible to signed in users"
on videos
for select
to authenticated
using (true);

drop policy if exists "Users can create their own videos" on videos;
create policy "Users can create their own videos"
on videos
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own videos" on videos;
create policy "Users can delete their own videos"
on videos
for delete
to authenticated
using (auth.uid() = user_id);
